import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DashboardWebSocketServer } from '../websocket-server.js';
import WebSocket from 'ws';

describe('DashboardWebSocketServer', () => {
  let server;
  const TEST_PORT = 3002; // Use different port to avoid conflicts

  beforeEach(() => {
    server = new DashboardWebSocketServer({ port: TEST_PORT });
  });

  afterEach(async () => {
    if (server && server.isRunning) {
      await server.stop();
    }
  });

  describe('Server Initialization', () => {
    it('should create server with default port', () => {
      const defaultServer = new DashboardWebSocketServer();
      expect(defaultServer.port).toBe(3001);
      expect(defaultServer.isRunning).toBe(false);
      expect(defaultServer.clients.size).toBe(0);
    });

    it('should create server with custom port', () => {
      expect(server.port).toBe(TEST_PORT);
      expect(server.isRunning).toBe(false);
    });

    it('should start server successfully', async () => {
      await server.start();
      expect(server.isRunning).toBe(true);
      expect(server.wss).toBeDefined();
    });

    it('should not start server twice', async () => {
      await server.start();
      expect(server.isRunning).toBe(true);
      
      // Try starting again
      await server.start();
      expect(server.isRunning).toBe(true);
    });

    it('should handle start errors gracefully', async () => {
      // Create server on invalid port
      const badServer = new DashboardWebSocketServer({ port: -1 });
      await expect(badServer.start()).rejects.toThrow();
    });
  });

  describe('Client Connections', () => {
    let client;

    afterEach(() => {
      if (client && client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    it('should accept client connections', async () => {
      await server.start();

      return new Promise((resolve) => {
        client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        client.on('open', () => {
          expect(server.clients.size).toBe(1);
          resolve();
        });
      });
    });

    it('should send welcome message to new clients', async () => {
      await server.start();

      return new Promise((resolve) => {
        client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          expect(message.type).toBe('connection');
          expect(message.data).toHaveProperty('clientId');
          expect(message.data).toHaveProperty('timestamp');
          resolve();
        });
      });
    });

    it('should handle multiple client connections', async () => {
      await server.start();
      const clients = [];

      return new Promise((resolve) => {
        let connectedCount = 0;
        const totalClients = 3;

        for (let i = 0; i < totalClients; i++) {
          const testClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
          clients.push(testClient);

          testClient.on('open', () => {
            connectedCount++;
            if (connectedCount === totalClients) {
              expect(server.clients.size).toBe(totalClients);
              // Clean up
              clients.forEach(c => c.close());
              resolve();
            }
          });
        }
      });
    });

    it('should remove client from tracking on disconnect', async () => {
      await server.start();

      return new Promise((resolve) => {
        client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        client.on('open', () => {
          expect(server.clients.size).toBe(1);
          client.close();
        });

        client.on('close', () => {
          // Give server time to process disconnect
          setTimeout(() => {
            expect(server.clients.size).toBe(0);
            resolve();
          }, 100);
        });
      });
    });
  });

  describe('Message Handling', () => {
    let client;

    beforeEach(async () => {
      await server.start();
      client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise(resolve => client.on('open', resolve));
    });

    afterEach(() => {
      if (client && client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    it('should handle ping messages', (done) => {
      client.send(JSON.stringify({ type: 'ping' }));
      
      // Skip welcome message
      let messageCount = 0;
      client.on('message', (data) => {
        messageCount++;
        if (messageCount === 1) return; // Skip welcome

        const message = JSON.parse(data.toString());
        expect(message.type).toBe('pong');
        expect(message.timestamp).toBeDefined();
        done();
      });
    });

    it('should handle subscription requests', (done) => {
      client.send(JSON.stringify({ 
        type: 'subscribe', 
        data: { channel: 'config-updates' }
      }));
      
      let messageCount = 0;
      client.on('message', (data) => {
        messageCount++;
        if (messageCount === 1) return; // Skip welcome

        const message = JSON.parse(data.toString());
        expect(message.type).toBe('subscribed');
        expect(message.data.channel).toBe('config-updates');
        done();
      });
    });

    it('should handle invalid JSON messages', (done) => {
      client.send('invalid json');
      
      let messageCount = 0;
      client.on('message', (data) => {
        messageCount++;
        if (messageCount === 1) return; // Skip welcome

        const message = JSON.parse(data.toString());
        expect(message.type).toBe('error');
        expect(message.data.message).toContain('Invalid message format');
        done();
      });
    });

    it('should handle unknown message types', (done) => {
      client.send(JSON.stringify({ type: 'unknown-type' }));
      
      let messageCount = 0;
      client.on('message', (data) => {
        messageCount++;
        if (messageCount === 1) return; // Skip welcome

        const message = JSON.parse(data.toString());
        expect(message.type).toBe('error');
        expect(message.data.message).toContain('Unknown message type');
        done();
      });
    });
  });

  describe('Broadcasting', () => {
    let clients;

    beforeEach(async () => {
      await server.start();
      clients = [];
      
      // Create 3 test clients
      for (let i = 0; i < 3; i++) {
        const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        await new Promise(resolve => client.on('open', resolve));
        clients.push(client);
      }
    });

    afterEach(() => {
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });
    });

    it('should broadcast to all connected clients', (done) => {
      const testMessage = { type: 'test', data: { value: 'broadcast-test' } };
      let receivedCount = 0;

      clients.forEach(client => {
        let messageCount = 0;
        client.on('message', (data) => {
          messageCount++;
          if (messageCount === 1) return; // Skip welcome

          const message = JSON.parse(data.toString());
          if (message.type === 'test') {
            expect(message.data.value).toBe('broadcast-test');
            receivedCount++;
            
            if (receivedCount === clients.length) {
              done();
            }
          }
        });
      });

      // Give clients time to set up listeners
      setTimeout(() => {
        server.broadcast(testMessage);
      }, 100);
    });

    it('should filter broadcast by channel subscription', async () => {
      // Subscribe first client to 'channel-a'
      clients[0].send(JSON.stringify({ 
        type: 'subscribe', 
        data: { channel: 'channel-a' }
      }));

      // Subscribe second client to 'channel-b'  
      clients[1].send(JSON.stringify({ 
        type: 'subscribe', 
        data: { channel: 'channel-b' }
      }));

      // Wait for subscriptions to be processed
      await new Promise(resolve => setTimeout(resolve, 150));

      return new Promise((resolve) => {
        let receivedByFirstClient = false;
        let receivedBySecondClient = false;
        let firstClientMessageCount = 0;
        let secondClientMessageCount = 0;

        // Track what first client receives (should receive channel-a broadcast)
        const firstHandler = (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'channel-test') {
            receivedByFirstClient = true;
            firstClientMessageCount++;
          }
        };
        clients[0].on('message', firstHandler);

        // Track what second client receives (should NOT receive channel-a broadcast)
        const secondHandler = (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'channel-test') {
            receivedBySecondClient = true;
            secondClientMessageCount++;
          }
        };
        clients[1].on('message', secondHandler);

        // Broadcast to channel-a only
        setTimeout(() => {
          server.broadcast({ type: 'channel-test', data: {} }, 'channel-a');
          
          // Check results after broadcast has time to propagate
          setTimeout(() => {
            // Clean up listeners
            clients[0].removeListener('message', firstHandler);
            clients[1].removeListener('message', secondHandler);

            expect(receivedByFirstClient).toBe(true);
            expect(receivedBySecondClient).toBe(false);
            resolve();
          }, 150);
        }, 100);
      });
    });
  });

  describe('Server Statistics', () => {
    it('should track connection count', async () => {
      await server.start();
      
      const client1 = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise(resolve => client1.on('open', resolve));
      
      const client2 = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise(resolve => client2.on('open', resolve));

      const stats = server.getStats();
      expect(stats.connectedClients).toBe(2);
      expect(stats.totalConnections).toBe(2);

      client1.close();
      client2.close();
    });

    it('should return correct stats when not running', () => {
      const stats = server.getStats();
      expect(stats.isRunning).toBe(false);
      expect(stats.connectedClients).toBe(0);
    });
  });

  describe('Server Shutdown', () => {
    it('should stop server gracefully', async () => {
      await server.start();
      expect(server.isRunning).toBe(true);

      await server.stop();
      expect(server.isRunning).toBe(false);
    });

    it('should close all client connections on shutdown', async () => {
      await server.start();
      
      const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise(resolve => client.on('open', resolve));

      expect(server.clients.size).toBe(1);

      await server.stop();
      expect(server.clients.size).toBe(0);
    });

    it('should handle stop when not running', async () => {
      expect(server.isRunning).toBe(false);
      await expect(server.stop()).resolves.not.toThrow();
    });
  });
});

