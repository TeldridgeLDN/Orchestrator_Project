/**
 * Dashboard Server Client Handling Tests
 * Tests for client message handling and initial state delivery
 * @module lib/__tests__/dashboard-server-client-handling.test.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocket from 'ws';
import { DashboardServer } from '../dashboard-server.js';
import { createMessage } from '../websocket-protocol.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import path from 'path';

const TEST_PORT = 8091;
const TEST_LOG_DIR = './test-logs-client-handling';
const TEST_CONFIG_PATH = './test-config-client-handling.json';

describe('Dashboard Server - Client Handling', () => {
  let server;
  let client;

  beforeEach(async () => {
    // Clean up and create test directories
    await rm(TEST_LOG_DIR, { recursive: true, force: true });
    await rm(TEST_CONFIG_PATH, { force: true });
    await mkdir(TEST_LOG_DIR, { recursive: true });

    // Create test config file
    await writeFile(TEST_CONFIG_PATH, JSON.stringify({
      name: 'test-project',
      version: '1.0.0'
    }));

    // Create server with test configuration
    server = new DashboardServer({
      port: TEST_PORT,
      rateLimit: {
        maxMessagesPerSecond: 10,
        burstLimit: 20
      },
      watchPaths: {
        config: TEST_CONFIG_PATH,
        logs: [TEST_LOG_DIR]
      }
    });

    await server.start();
  });

  afterEach(async () => {
    // Close client first
    if (client) {
      if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CONNECTING) {
        client.close();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      client = null;
    }

    // Stop server
    if (server) {
      try {
        await server.stop();
      } catch (error) {
        // Ignore stop errors in cleanup
      }
      server = null;
    }

    // Wait for port to be released
    await new Promise(resolve => setTimeout(resolve, 200));

    // Clean up test files
    try {
      await rm(TEST_LOG_DIR, { recursive: true, force: true });
      await rm(TEST_CONFIG_PATH, { force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initial State Delivery', () => {
    it('should send initial state to newly connected client', async () => {
      return new Promise((resolve) => {
        const messages = [];
        client = new WebSocket(`ws://localhost:${TEST_PORT}`);

        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          messages.push(message);

          // We expect at least 3 messages: connection, stats, and file-watcher status
          if (messages.length >= 3) {
            // Check for connection/stats messages
            const hasServerStatus = messages.some(m => 
              m.type === 'status-update' && 
              m.data.component === 'server'
            );

            const hasFileWatcherStatus = messages.some(m => 
              m.type === 'status-update' && 
              m.data.component === 'file-watcher'
            );

            expect(hasServerStatus).toBe(true);
            expect(hasFileWatcherStatus).toBe(true);
            
            resolve();
          }
        });
      });
    }, 10000);

    it('should include config in initial state if available', async () => {
      return new Promise((resolve) => {
        client = new WebSocket(`ws://localhost:${TEST_PORT}`);

        const messages = [];
        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          messages.push(message);

          const configMessage = messages.find(m => m.type === 'config-change');
          if (configMessage) {
            // Just verify that config data exists and has expected structure
            expect(configMessage.data).toHaveProperty('config');
            expect(configMessage.data).toHaveProperty('path');
            expect(configMessage.data).toHaveProperty('filename');
            expect(typeof configMessage.data.config).toBe('object');
            resolve();
          }
        });
      });
    }, 10000);
  });

  describe('Client Request Handling', () => {
    beforeEach(async () => {
      client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise(resolve => client.on('open', resolve));
      // Wait for initial state messages
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should handle getStats request', async () => {
      return new Promise((resolve) => {
        const requestId = Date.now().toString();
        
        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'response' && message.correlationId === requestId) {
            expect(message.data.success).toBe(true);
            expect(message.data.data).toHaveProperty('broadcast');
            expect(message.data.data).toHaveProperty('clients');
            resolve();
          }
        });

        client.send(JSON.stringify({
          id: requestId,
          type: 'request',
          timestamp: Date.now(),
          data: {
            requestType: 'getStats'
          }
        }));
      });
    });

    it('should handle getConfig request', async () => {
      return new Promise((resolve) => {
        const requestId = Date.now().toString();
        
        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'response' && message.correlationId === requestId) {
            expect(message.data.success).toBe(true);
            expect(message.data.data).toHaveProperty('path');
            expect(message.data.data).toHaveProperty('data');
            expect(message.data.data.data.name).toBe('test-project');
            resolve();
          }
        });

        client.send(JSON.stringify({
          id: requestId,
          type: 'request',
          timestamp: Date.now(),
          data: {
            requestType: 'getConfig'
          }
        }));
      });
    });

    it('should handle getFileWatcherStatus request', async () => {
      return new Promise((resolve) => {
        const requestId = Date.now().toString();
        
        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'response' && message.correlationId === requestId) {
            expect(message.data.success).toBe(true);
            expect(message.data.data).toHaveProperty('isWatching');
            expect(message.data.data).toHaveProperty('watchedPaths');
            resolve();
          }
        });

        client.send(JSON.stringify({
          id: requestId,
          type: 'request',
          timestamp: Date.now(),
          data: {
            requestType: 'getFileWatcherStatus'
          }
        }));
      });
    });

    it('should handle getConnectedClients request', async () => {
      return new Promise((resolve) => {
        const requestId = Date.now().toString();
        
        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'response' && message.correlationId === requestId) {
            expect(message.data.success).toBe(true);
            expect(message.data.data).toHaveProperty('count');
            expect(message.data.data).toHaveProperty('clients');
            expect(message.data.data.count).toBeGreaterThan(0);
            expect(message.data.data.clients).toBeInstanceOf(Array);
            resolve();
          }
        });

        client.send(JSON.stringify({
          id: requestId,
          type: 'request',
          timestamp: Date.now(),
          data: {
            requestType: 'getConnectedClients'
          }
        }));
      });
    });

    it('should handle getLogs request', async () => {
      // Create a test log file
      await writeFile(path.join(TEST_LOG_DIR, 'test.log'), 
        'Line 1\nLine 2\nLine 3\n'
      );

      return new Promise((resolve) => {
        const requestId = Date.now().toString();
        
        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'response' && message.correlationId === requestId) {
            expect(message.data.success).toBe(true);
            expect(message.data.data).toHaveProperty('logs');
            expect(message.data.data.logs).toBeInstanceOf(Array);
            resolve();
          }
        });

        client.send(JSON.stringify({
          id: requestId,
          type: 'request',
          timestamp: Date.now(),
          data: {
            requestType: 'getLogs',
            params: { limit: 10 }
          }
        }));
      });
    });

    it('should handle refreshState request', async () => {
      return new Promise((resolve) => {
        const requestId = Date.now().toString();
        
        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'response' && message.correlationId === requestId) {
            expect(message.data.success).toBe(true);
            expect(message.data.data.refreshed).toBe(true);
            resolve();
          }
        });

        client.send(JSON.stringify({
          id: requestId,
          type: 'request',
          timestamp: Date.now(),
          data: {
            requestType: 'refreshState'
          }
        }));
      });
    });

    it('should return error for unknown request type', async () => {
      return new Promise((resolve) => {
        const requestId = Date.now().toString();
        
        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'error' && message.correlationId === requestId) {
            expect(message.data.code).toBe('REQUEST_FAILED');
            expect(message.data.message).toContain('Unknown request type');
            resolve();
          }
        });

        client.send(JSON.stringify({
          id: requestId,
          type: 'request',
          timestamp: Date.now(),
          data: {
            requestType: 'unknownRequest'
          }
        }));
      });
    });
  });

  describe('Message Validation', () => {
    beforeEach(async () => {
      client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise(resolve => client.on('open', resolve));
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should handle malformed JSON', async () => {
      return new Promise((resolve) => {
        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'error' && message.data.code === 'PARSE_ERROR') {
            expect(message.data.message).toContain('Invalid JSON');
            resolve();
          }
        });

        client.send('{ invalid json }');
      });
    });

    it('should handle missing message type', async () => {
      return new Promise((resolve) => {
        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'error' && message.data.code === 'INVALID_MESSAGE') {
            resolve();
          }
        });

        client.send(JSON.stringify({
          id: Date.now().toString(),
          timestamp: Date.now(),
          data: {}
        }));
      });
    });
  });

  describe('Concurrent Clients', () => {
    it('should handle multiple clients requesting data simultaneously', async () => {
      const clientCount = 5;
      const clients = [];

      // Connect multiple clients
      for (let i = 0; i < clientCount; i++) {
        const c = new WebSocket(`ws://localhost:${TEST_PORT}`);
        clients.push(c);
        await new Promise(resolve => c.on('open', resolve));
      }

      // Wait for initial state
      await new Promise(resolve => setTimeout(resolve, 300));

      // All clients request stats simultaneously
      const results = await Promise.all(
        clients.map((c, index) => {
          return new Promise((resolve) => {
            const requestId = `req-${index}-${Date.now()}`;
            
            c.on('message', (data) => {
              const message = JSON.parse(data.toString());
              if (message.type === 'response' && message.correlationId === requestId) {
                resolve(message.data.success);
              }
            });

            c.send(JSON.stringify({
              id: requestId,
              type: 'request',
              timestamp: Date.now(),
              data: { requestType: 'getStats' }
            }));
          });
        })
      );

      // All requests should succeed
      expect(results.every(r => r === true)).toBe(true);

      // Cleanup
      clients.forEach(c => c.close());
    }, 15000);
  });
});

