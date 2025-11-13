import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DashboardServer } from '../dashboard-server.js';
import { createMessage, MessagePriority } from '../websocket-protocol.js';
import WebSocket from 'ws';
import { writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

describe('DashboardServer', () => {
  let server;
  let testDir;
  let testConfigPath;
  let testLogPath;
  const TEST_PORT = 3003;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `dashboard-server-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    
    testConfigPath = path.join(testDir, 'config.json');
    testLogPath = path.join(testDir, 'logs');
    await mkdir(testLogPath, { recursive: true });

    // Initialize server with test paths
    server = new DashboardServer({
      port: TEST_PORT,
      watcherOptions: {
        watchPaths: {
          config: testConfigPath,
          logs: [testLogPath],
          projectConfig: path.join(testDir, 'package.json')
        }
      }
    });
  });

  afterEach(async () => {
    if (server && server.isRunning) {
      await server.stop();
    }

    // Clean up test directory
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('Initialization', () => {
    it('should create server with default port', () => {
      const defaultServer = new DashboardServer();
      expect(defaultServer.port).toBe(3001);
      expect(defaultServer.isRunning).toBe(false);
    });

    it('should create server with custom port', () => {
      expect(server.port).toBe(TEST_PORT);
    });

    it('should initialize components', () => {
      expect(server.wsServer).toBeDefined();
      expect(server.fileWatcher).toBeDefined();
      expect(server.stats).toBeDefined();
    });
  });

  describe('Server Lifecycle', () => {
    it('should start server successfully', async () => {
      // Create required files
      await writeFile(testConfigPath, JSON.stringify({ test: true }));
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));

      await server.start();
      
      expect(server.isRunning).toBe(true);
      expect(server.wsServer.isRunning).toBe(true);
      expect(server.fileWatcher.isActive).toBe(true);
    });

    it('should prevent starting twice', async () => {
      await writeFile(testConfigPath, JSON.stringify({ test: true }));
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));

      await server.start();
      expect(server.isRunning).toBe(true);

      // Try starting again
      await server.start();
      expect(server.isRunning).toBe(true);
    });

    it('should stop server gracefully', async () => {
      await writeFile(testConfigPath, JSON.stringify({ test: true }));
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));

      await server.start();
      expect(server.isRunning).toBe(true);

      await server.stop();
      expect(server.isRunning).toBe(false);
      expect(server.wsServer.isRunning).toBe(false);
    });

    it('should handle stop when not running', async () => {
      expect(server.isRunning).toBe(false);
      await expect(server.stop()).resolves.not.toThrow();
    });
  });

  describe('Broadcasting', () => {
    let client;

    beforeEach(async () => {
      await writeFile(testConfigPath, JSON.stringify({ test: true }));
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
      await server.start();
    });

    afterEach(() => {
      if (client && client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    it('should broadcast message to connected clients', async () => {
      return new Promise((resolve) => {
        client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        let messageCount = 0;
        client.on('message', (data) => {
          messageCount++;
          if (messageCount === 1) return; // Skip welcome message

          const message = JSON.parse(data.toString());
          expect(message.type).toBe('status-update');
          expect(message.data.status).toBe('test');
          resolve();
        });

        client.on('open', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const testMessage = createMessage.statusUpdate({
            component: 'test',
            status: 'test',
            message: 'Test broadcast'
          });
          
          await server.broadcast(testMessage);
        });
      });
    }, 10000);

    it('should broadcast to multiple clients', async () => {
      const clients = [];
      const clientCount = 3;

      // Create multiple clients
      for (let i = 0; i < clientCount; i++) {
        const c = new WebSocket(`ws://localhost:${TEST_PORT}`);
        clients.push(c);
        await new Promise(resolve => c.on('open', resolve));
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const result = await server.broadcast(createMessage.statusUpdate({
        component: 'test',
        status: 'broadcast',
        message: 'Multi-client test'
      }));

      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(clientCount);
      
      clients.forEach(client => client.close());
    });

    it('should filter broadcasts by channel subscription', async () => {
      return new Promise((resolve) => {
        client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        let messageCount = 0;
        let receivedConfigMessage = false;

        client.on('message', (data) => {
          messageCount++;
          if (messageCount === 1) return; // Skip welcome
          if (messageCount === 2) return; // Skip subscription confirmation

          const message = JSON.parse(data.toString());
          if (message.type === 'config-change') {
            receivedConfigMessage = true;
            resolve();
          }
        });

        client.on('open', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));

          // Subscribe to config channel
          client.send(JSON.stringify({
            type: 'subscribe',
            data: { channel: 'config' }
          }));

          await new Promise(resolve => setTimeout(resolve, 200));

          // Broadcast on config channel
          const configMessage = createMessage.configChange({
            path: '/test/config.json',
            filename: 'config.json',
            config: { updated: true }
          });

          await server.broadcast(configMessage, 'config');
        });
      });
    }, 10000);

    it('should return broadcast statistics', async () => {
      client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise(resolve => client.on('open', resolve));
      await new Promise(resolve => setTimeout(resolve, 100));

      const message = createMessage.statusUpdate({
        component: 'test',
        status: 'ok',
        message: 'Stats test'
      });

      const result = await server.broadcast(message);

      expect(result.success).toBe(true);
      expect(result.sentCount).toBeGreaterThan(0);
      expect(result.totalClients).toBeGreaterThan(0);
      expect(result.broadcastTime).toBeGreaterThanOrEqual(0);

      client.close();
    });
  });

  describe('File Watcher Integration', () => {
    let client;

    beforeEach(async () => {
      await writeFile(testConfigPath, JSON.stringify({ version: '1.0.0' }));
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
      await server.start();
    });

    afterEach(() => {
      if (client && client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    it('should broadcast config changes', async () => {
      return new Promise((resolve) => {
        client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        let messageCount = 0;
        client.on('message', (data) => {
          messageCount++;
          if (messageCount === 1) return; // Skip welcome
          if (messageCount === 2) return; // Skip subscription

          const message = JSON.parse(data.toString());
          if (message.type === 'config-change') {
            expect(message.data.config.version).toBe('2.0.0');
            resolve();
          }
        });

        client.on('open', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));

          // Subscribe to config
          client.send(JSON.stringify({
            type: 'subscribe',
            data: { channel: 'config' }
          }));

          await new Promise(resolve => setTimeout(resolve, 200));

          // Modify config file
          await writeFile(testConfigPath, JSON.stringify({ version: '2.0.0' }));
        });
      });
    }, 15000);

    it('should broadcast log changes', async () => {
      // Create initial log file before starting
      const logFile = path.join(testLogPath, 'test.log');
      await writeFile(logFile, 'Initial log\n');
      
      return new Promise((resolve) => {
        client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        let messageCount = 0;
        client.on('message', (data) => {
          messageCount++;
          if (messageCount === 1) return;
          if (messageCount === 2) return;

          const message = JSON.parse(data.toString());
          if (message.type === 'log-change') {
            expect(message.data.filename).toBe('test.log');
            client.close();
            resolve();
          }
        });

        client.on('open', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));

          client.send(JSON.stringify({
            type: 'subscribe',
            data: { channel: 'logs' }
          }));

          await new Promise(resolve => setTimeout(resolve, 300));

          // Modify the log file
          await writeFile(logFile, 'Initial log\nNew entry\n');
        });
      });
    }, 20000);
  });

  describe('Rate Limiting', () => {
    beforeEach(async () => {
      // Configure aggressive rate limiting for testing
      server.rateLimitConfig.maxMessagesPerSecond = 5;
      
      await writeFile(testConfigPath, JSON.stringify({ test: true }));
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
      await server.start();
    });

    it('should queue messages when rate limit reached', async () => {
      const message = createMessage.statusUpdate({
        component: 'test',
        status: 'ok',
        message: 'Rate limit test'
      });

      // Send messages up to rate limit
      for (let i = 0; i < 5; i++) {
        await server.broadcast(message);
      }

      // Next message should be queued
      const result = await server.broadcast(message);
      expect(result.queued).toBe(true);
      expect(server.broadcastQueue.length).toBeGreaterThan(0);
    });

    it('should process queued messages', async () => {
      const message = createMessage.statusUpdate({
        component: 'test',
        status: 'ok',
        message: 'Queue test'
      });

      // Fill queue
      for (let i = 0; i < 10; i++) {
        await server.queueBroadcast(message);
      }

      expect(server.broadcastQueue.length).toBe(10);

      // Wait for queue processor
      await new Promise(resolve => setTimeout(resolve, 500));

      // Queue should be processed
      expect(server.broadcastQueue.length).toBeLessThan(10);
    });
  });

  describe('Priority Broadcasting', () => {
    let client;

    beforeEach(async () => {
      await writeFile(testConfigPath, JSON.stringify({ test: true }));
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
      await server.start();

      client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise(resolve => client.on('open', resolve));
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterEach(() => {
      if (client && client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    it('should bypass rate limit for high priority messages', async () => {
      // Fill rate limit
      server.rateLimitConfig.maxMessagesPerSecond = 1;
      server.rateLimitConfig.currentCount = 1;

      const highPriorityMsg = createMessage.error('Critical error');
      const result = await server.broadcastWithPriority(
        highPriorityMsg,
        MessagePriority.HIGH
      );

      expect(result.success).toBe(true);
      expect(result.queued).toBeUndefined();
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await writeFile(testConfigPath, JSON.stringify({ test: true }));
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
      await server.start();
    });

    it('should track broadcast statistics', async () => {
      const message = createMessage.statusUpdate({
        component: 'test',
        status: 'ok',
        message: 'Stats test'
      });

      await server.broadcast(message);
      await server.broadcast(message);

      const stats = server.getStats();
      expect(stats.broadcast.totalBroadcasts).toBe(2);
      expect(stats.broadcast.lastBroadcast).toBeDefined();
    });

    it('should provide comprehensive server stats', async () => {
      const stats = server.getStats();

      expect(stats.server).toBeDefined();
      expect(stats.server.isRunning).toBe(true);
      expect(stats.server.port).toBe(TEST_PORT);

      expect(stats.websocket).toBeDefined();
      expect(stats.fileWatcher).toBeDefined();
      expect(stats.broadcast).toBeDefined();
    });
  });

  describe('Custom Messages', () => {
    let client;

    beforeEach(async () => {
      await writeFile(testConfigPath, JSON.stringify({ test: true }));
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
      await server.start();
    });

    afterEach(() => {
      if (client && client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    it('should send custom messages', async () => {
      return new Promise((resolve) => {
        client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        let messageCount = 0;
        client.on('message', (data) => {
          messageCount++;
          if (messageCount === 1) return;

          const message = JSON.parse(data.toString());
          if (message.type === 'custom-event') {
            expect(message.data.value).toBe('test');
            resolve();
          }
        });

        client.on('open', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          await server.sendCustomMessage('custom-event', { value: 'test' });
        });
      });
    }, 10000);
  });

  describe('Client-Specific Broadcasting', () => {
    let client1, client2;

    beforeEach(async () => {
      await writeFile(testConfigPath, JSON.stringify({ test: true }));
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
      await server.start();

      client1 = new WebSocket(`ws://localhost:${TEST_PORT}`);
      client2 = new WebSocket(`ws://localhost:${TEST_PORT}`);
      
      await Promise.all([
        new Promise(resolve => client1.on('open', resolve)),
        new Promise(resolve => client2.on('open', resolve))
      ]);

      await new Promise(resolve => setTimeout(resolve, 200));
    });

    afterEach(() => {
      if (client1 && client1.readyState === WebSocket.OPEN) client1.close();
      if (client2 && client2.readyState === WebSocket.OPEN) client2.close();
    });

    it('should broadcast to specific clients', async () => {
      // Get first client ID
      const clients = Array.from(server.wsServer.clients);
      expect(clients.length).toBeGreaterThanOrEqual(2);
      
      const targetClientId = clients[0].clientId;

      const message = createMessage.statusUpdate({
        component: 'test',
        status: 'targeted',
        message: 'Targeted message'
      });

      const result = await server.broadcastToClients([targetClientId], message);

      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(1);
      expect(result.targetClients).toBe(1);
    });
  });
});

