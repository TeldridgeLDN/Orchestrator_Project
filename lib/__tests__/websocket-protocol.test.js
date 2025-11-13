import { describe, it, expect, beforeEach } from 'vitest';
import {
  MessageType,
  MessagePriority,
  SubscriptionChannel,
  ConnectionMessage,
  SubscribeMessage,
  UnsubscribeMessage,
  RequestMessage,
  ResponseMessage,
  ErrorMessage,
  ConfigChangeMessage,
  LogChangeMessage,
  StatusUpdateMessage,
  MetricsUpdateMessage,
  ProtocolSerializer,
  ProtocolDeserializer,
  ProtocolValidator,
  ProtocolBuilder,
  builder,
  createMessage
} from '../websocket-protocol.js';

describe('WebSocket Protocol', () => {
  describe('Message Types', () => {
    it('should define all message types', () => {
      expect(MessageType.CONNECTION).toBe('connection');
      expect(MessageType.SUBSCRIBE).toBe('subscribe');
      expect(MessageType.CONFIG_CHANGE).toBe('config-change');
      expect(MessageType.ERROR).toBe('error');
    });

    it('should have unique message type values', () => {
      const values = Object.values(MessageType);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('Priority Levels', () => {
    it('should define priority levels', () => {
      expect(MessagePriority.LOW).toBe(0);
      expect(MessagePriority.NORMAL).toBe(1);
      expect(MessagePriority.HIGH).toBe(2);
      expect(MessagePriority.CRITICAL).toBe(3);
    });
  });

  describe('Subscription Channels', () => {
    it('should define subscription channels', () => {
      expect(SubscriptionChannel.CONFIG).toBe('config');
      expect(SubscriptionChannel.LOGS).toBe('logs');
      expect(SubscriptionChannel.ALL).toBe('*');
    });
  });

  describe('ConnectionMessage', () => {
    it('should create connection message', () => {
      const msg = new ConnectionMessage({ clientId: '123' });
      
      expect(msg.type).toBe(MessageType.CONNECTION);
      expect(msg.data.clientId).toBe('123');
      expect(msg.timestamp).toBeDefined();
      expect(msg.id).toBeDefined();
    });

    it('should include server version', () => {
      const msg = new ConnectionMessage({ 
        clientId: '123', 
        serverVersion: '2.0.0' 
      });
      
      expect(msg.data.serverVersion).toBe('2.0.0');
    });
  });

  describe('SubscribeMessage', () => {
    it('should create subscribe message', () => {
      const msg = new SubscribeMessage('config');
      
      expect(msg.type).toBe(MessageType.SUBSCRIBE);
      expect(msg.data.channel).toBe('config');
      expect(msg.channel).toBe('config');
    });

    it('should validate channel presence', () => {
      const msg = new SubscribeMessage('logs');
      const validation = msg.validate();
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation without channel', () => {
      const msg = new SubscribeMessage();
      msg.data.channel = undefined;
      
      const validation = msg.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('UnsubscribeMessage', () => {
    it('should create unsubscribe message', () => {
      const msg = new UnsubscribeMessage('config');
      
      expect(msg.type).toBe(MessageType.UNSUBSCRIBE);
      expect(msg.data.channel).toBe('config');
    });
  });

  describe('RequestMessage', () => {
    it('should create request message', () => {
      const msg = new RequestMessage('getData', { filter: 'active' });
      
      expect(msg.type).toBe(MessageType.REQUEST);
      expect(msg.data.requestType).toBe('getData');
      expect(msg.data.params.filter).toBe('active');
    });

    it('should support correlation ID', () => {
      const msg = new RequestMessage('getData', {}, { correlationId: 'req-123' });
      
      expect(msg.correlationId).toBe('req-123');
    });
  });

  describe('ResponseMessage', () => {
    it('should create response message', () => {
      const msg = new ResponseMessage({ 
        success: true, 
        result: 'data' 
      });
      
      expect(msg.type).toBe(MessageType.RESPONSE);
      expect(msg.data.success).toBe(true);
      expect(msg.data.result).toBe('data');
    });

    it('should default success to true', () => {
      const msg = new ResponseMessage({ result: 'data' });
      expect(msg.data.success).toBe(true);
    });

    it('should link to request via correlation ID', () => {
      const msg = new ResponseMessage(
        { success: true }, 
        { correlationId: 'req-123' }
      );
      
      expect(msg.correlationId).toBe('req-123');
    });
  });

  describe('ErrorMessage', () => {
    it('should create error message from Error object', () => {
      const error = new Error('Test error');
      error.code = 'TEST_ERROR';
      
      const msg = new ErrorMessage(error);
      
      expect(msg.type).toBe(MessageType.ERROR);
      expect(msg.data.message).toBe('Test error');
      expect(msg.data.code).toBe('TEST_ERROR');
      expect(msg.priority).toBe(MessagePriority.HIGH);
    });

    it('should create error message from string', () => {
      const msg = new ErrorMessage('Simple error');
      
      expect(msg.data.message).toBe('Simple error');
      expect(msg.data.code).toBe('UNKNOWN_ERROR');
    });

    it('should include error details', () => {
      const error = { 
        message: 'Error', 
        code: 'ERR_001',
        details: { field: 'username' }
      };
      
      const msg = new ErrorMessage(error);
      expect(msg.data.details.field).toBe('username');
    });
  });

  describe('ConfigChangeMessage', () => {
    it('should create config change message', () => {
      const configData = {
        path: '/path/to/config.json',
        filename: 'config.json',
        config: { version: '2.0.0' }
      };
      
      const msg = new ConfigChangeMessage(configData);
      
      expect(msg.type).toBe(MessageType.CONFIG_CHANGE);
      expect(msg.data.path).toBe('/path/to/config.json');
      expect(msg.data.config.version).toBe('2.0.0');
      expect(msg.channel).toBe(SubscriptionChannel.CONFIG);
    });

    it('should include previous config', () => {
      const configData = {
        path: '/path/to/config.json',
        filename: 'config.json',
        config: { version: '2.0.0' },
        previousConfig: { version: '1.0.0' }
      };
      
      const msg = new ConfigChangeMessage(configData);
      expect(msg.data.previousConfig.version).toBe('1.0.0');
    });
  });

  describe('LogChangeMessage', () => {
    it('should create log change message', () => {
      const logData = {
        path: '/path/to/app.log',
        filename: 'app.log',
        directory: '/path/to',
        recentContent: 'Log line 1\nLog line 2'
      };
      
      const msg = new LogChangeMessage(logData);
      
      expect(msg.type).toBe(MessageType.LOG_CHANGE);
      expect(msg.data.filename).toBe('app.log');
      expect(msg.data.recentContent).toContain('Log line 1');
      expect(msg.channel).toBe(SubscriptionChannel.LOGS);
    });
  });

  describe('StatusUpdateMessage', () => {
    it('should create status update message', () => {
      const statusData = {
        component: 'database',
        status: 'connected',
        message: 'Database connection established'
      };
      
      const msg = new StatusUpdateMessage(statusData);
      
      expect(msg.type).toBe(MessageType.STATUS_UPDATE);
      expect(msg.data.component).toBe('database');
      expect(msg.data.status).toBe('connected');
      expect(msg.channel).toBe(SubscriptionChannel.STATUS);
    });
  });

  describe('MetricsUpdateMessage', () => {
    it('should create metrics update message', () => {
      const metricsData = {
        metrics: { cpu: 45.2, memory: 67.8 },
        interval: '1m',
        aggregation: 'avg'
      };
      
      const msg = new MetricsUpdateMessage(metricsData);
      
      expect(msg.type).toBe(MessageType.METRICS_UPDATE);
      expect(msg.data.metrics.cpu).toBe(45.2);
      expect(msg.channel).toBe(SubscriptionChannel.METRICS);
    });
  });

  describe('ProtocolSerializer', () => {
    it('should serialize message to JSON string', () => {
      const msg = new ConnectionMessage({ clientId: '123' });
      const json = ProtocolSerializer.serialize(msg);
      
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.type).toBe(MessageType.CONNECTION);
      expect(parsed.data.clientId).toBe('123');
    });

    it('should serialize plain objects', () => {
      const obj = { type: 'custom', data: { value: 42 } };
      const json = ProtocolSerializer.serialize(obj);
      
      const parsed = JSON.parse(json);
      expect(parsed.data.value).toBe(42);
    });

    it('should serialize batch of messages', () => {
      const messages = [
        new ConnectionMessage({ clientId: '123' }),
        new SubscribeMessage('config')
      ];
      
      const json = ProtocolSerializer.serializeBatch(messages);
      const parsed = JSON.parse(json);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].type).toBe(MessageType.CONNECTION);
      expect(parsed[1].type).toBe(MessageType.SUBSCRIBE);
    });

    it('should handle serialization errors', () => {
      const circular = {};
      circular.self = circular;
      
      expect(() => ProtocolSerializer.serialize(circular)).toThrow();
    });
  });

  describe('ProtocolDeserializer', () => {
    it('should deserialize JSON string to object', () => {
      const json = JSON.stringify({
        type: MessageType.CONNECTION,
        data: { clientId: '123' },
        timestamp: Date.now()
      });
      
      const msg = ProtocolDeserializer.deserialize(json);
      expect(msg.type).toBe(MessageType.CONNECTION);
      expect(msg.data.clientId).toBe('123');
    });

    it('should throw on invalid JSON', () => {
      expect(() => ProtocolDeserializer.deserialize('invalid json')).toThrow();
    });

    it('should throw on missing type', () => {
      const json = JSON.stringify({ data: {} });
      expect(() => ProtocolDeserializer.deserialize(json)).toThrow();
    });

    it('should deserialize to typed instance', () => {
      const original = new SubscribeMessage('config');
      const json = ProtocolSerializer.serialize(original);
      
      const deserialized = ProtocolDeserializer.deserializeToInstance(json);
      expect(deserialized.type).toBe(MessageType.SUBSCRIBE);
      expect(deserialized.data.channel).toBe('config');
    });

    it('should deserialize batch of messages', () => {
      const json = JSON.stringify([
        { type: MessageType.PING, data: {}, timestamp: Date.now() },
        { type: MessageType.PONG, data: {}, timestamp: Date.now() }
      ]);
      
      const messages = ProtocolDeserializer.deserializeBatch(json);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toHaveLength(2);
    });

    it('should throw on non-array batch', () => {
      const json = JSON.stringify({ not: 'array' });
      expect(() => ProtocolDeserializer.deserializeBatch(json)).toThrow();
    });
  });

  describe('ProtocolValidator', () => {
    it('should validate valid message', () => {
      const msg = new ConnectionMessage({ clientId: '123' });
      const validation = ProtocolValidator.validate(msg);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate plain object', () => {
      const obj = {
        type: 'custom',
        data: { value: 42 },
        timestamp: Date.now()
      };
      
      const validation = ProtocolValidator.validate(obj);
      expect(validation.valid).toBe(true);
    });

    it('should fail validation without type', () => {
      const obj = { data: {}, timestamp: Date.now() };
      const validation = ProtocolValidator.validate(obj);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('type is required');
    });

    it('should fail validation without timestamp', () => {
      const obj = { type: 'custom', data: {} };
      const validation = ProtocolValidator.validate(obj);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('timestamp is required');
    });

    it('should validate message types', () => {
      expect(ProtocolValidator.isValidType(MessageType.CONNECTION)).toBe(true);
      expect(ProtocolValidator.isValidType('invalid-type')).toBe(false);
    });

    it('should validate subscription channels', () => {
      expect(ProtocolValidator.isValidChannel(SubscriptionChannel.CONFIG)).toBe(true);
      expect(ProtocolValidator.isValidChannel('invalid-channel')).toBe(false);
    });
  });

  describe('ProtocolBuilder', () => {
    let testBuilder;

    beforeEach(() => {
      testBuilder = new ProtocolBuilder();
    });

    it('should build message using fluent API', () => {
      const msg = testBuilder
        .type(MessageType.STATUS_UPDATE)
        .data({ component: 'api', status: 'healthy' })
        .channel(SubscriptionChannel.STATUS)
        .priority(MessagePriority.HIGH)
        .build();
      
      expect(msg.type).toBe(MessageType.STATUS_UPDATE);
      expect(msg.data.component).toBe('api');
      expect(msg.channel).toBe(SubscriptionChannel.STATUS);
      expect(msg.priority).toBe(MessagePriority.HIGH);
    });

    it('should build and serialize in one call', () => {
      const json = testBuilder
        .type(MessageType.PING)
        .data({})
        .buildAndSerialize();
      
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.type).toBe(MessageType.PING);
    });

    it('should reset after build', () => {
      testBuilder.type(MessageType.PING).data({ test: true }).build();
      
      const msg = testBuilder.type(MessageType.PONG).build();
      expect(msg.type).toBe(MessageType.PONG);
      expect(msg.data.test).toBeUndefined();
    });

    it('should throw without type', () => {
      expect(() => testBuilder.data({ test: true }).build()).toThrow();
    });

    it('should support correlation ID', () => {
      const msg = testBuilder
        .type(MessageType.RESPONSE)
        .data({ success: true })
        .correlationId('req-123')
        .build();
      
      expect(msg.correlationId).toBe('req-123');
    });
  });

  describe('Global Builder Instance', () => {
    it('should provide global builder instance', () => {
      expect(builder).toBeDefined();
      expect(builder instanceof ProtocolBuilder).toBe(true);
    });

    it('should be reusable', () => {
      const msg1 = builder.type(MessageType.PING).build();
      const msg2 = builder.type(MessageType.PONG).build();
      
      expect(msg1.type).toBe(MessageType.PING);
      expect(msg2.type).toBe(MessageType.PONG);
    });
  });

  describe('createMessage Factory', () => {
    it('should create connection message', () => {
      const msg = createMessage.connection('client-123', '1.0.0');
      expect(msg instanceof ConnectionMessage).toBe(true);
      expect(msg.data.clientId).toBe('client-123');
    });

    it('should create subscribe message', () => {
      const msg = createMessage.subscribe('config');
      expect(msg instanceof SubscribeMessage).toBe(true);
      expect(msg.data.channel).toBe('config');
    });

    it('should create unsubscribe message', () => {
      const msg = createMessage.unsubscribe('logs');
      expect(msg instanceof UnsubscribeMessage).toBe(true);
    });

    it('should create request message', () => {
      const msg = createMessage.request('getData', { filter: 'active' }, 'req-123');
      expect(msg instanceof RequestMessage).toBe(true);
      expect(msg.correlationId).toBe('req-123');
    });

    it('should create response message', () => {
      const msg = createMessage.response({ success: true }, 'req-123');
      expect(msg instanceof ResponseMessage).toBe(true);
      expect(msg.correlationId).toBe('req-123');
    });

    it('should create error message', () => {
      const msg = createMessage.error(new Error('Test error'));
      expect(msg instanceof ErrorMessage).toBe(true);
      expect(msg.data.message).toBe('Test error');
    });

    it('should create config change message', () => {
      const msg = createMessage.configChange({ 
        path: '/config.json', 
        filename: 'config.json',
        config: {} 
      });
      expect(msg instanceof ConfigChangeMessage).toBe(true);
    });

    it('should create log change message', () => {
      const msg = createMessage.logChange({ 
        path: '/app.log', 
        filename: 'app.log',
        directory: '/',
        recentContent: 'log content' 
      });
      expect(msg instanceof LogChangeMessage).toBe(true);
    });

    it('should create status update message', () => {
      const msg = createMessage.statusUpdate({ 
        component: 'api', 
        status: 'healthy' 
      });
      expect(msg instanceof StatusUpdateMessage).toBe(true);
    });

    it('should create metrics update message', () => {
      const msg = createMessage.metricsUpdate({ 
        metrics: { cpu: 50 },
        interval: '1m'
      });
      expect(msg instanceof MetricsUpdateMessage).toBe(true);
    });

    it('should create ping message', () => {
      const msg = createMessage.ping();
      expect(msg.type).toBe(MessageType.PING);
    });

    it('should create pong message', () => {
      const msg = createMessage.pong();
      expect(msg.type).toBe(MessageType.PONG);
      expect(msg.data.timestamp).toBeDefined();
    });
  });

  describe('Round-trip Serialization', () => {
    it('should maintain data integrity through serialization', () => {
      const original = new ConfigChangeMessage({
        path: '/config.json',
        filename: 'config.json',
        config: { 
          version: '2.0.0', 
          settings: { enabled: true }
        }
      });
      
      const json = ProtocolSerializer.serialize(original);
      const deserialized = ProtocolDeserializer.deserialize(json);
      
      expect(deserialized.type).toBe(original.type);
      expect(deserialized.data.config.version).toBe('2.0.0');
      expect(deserialized.data.config.settings.enabled).toBe(true);
    });

    it('should handle large payloads', () => {
      const largeData = {
        path: '/large.log',
        filename: 'large.log',
        directory: '/logs',
        recentContent: 'x'.repeat(10000)
      };
      
      const msg = new LogChangeMessage(largeData);
      const json = ProtocolSerializer.serialize(msg);
      const deserialized = ProtocolDeserializer.deserialize(json);
      
      expect(deserialized.data.recentContent.length).toBe(10000);
    });
  });
});

