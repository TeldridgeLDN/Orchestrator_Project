/**
 * WebSocket Message Protocol
 * Defines standardized message formats for dashboard real-time updates
 * @module lib/websocket-protocol
 */

import { createLogger } from './utils/logger.js';

const logger = createLogger('WebSocketProtocol');

/**
 * Message Types Enum
 * Defines all supported message types in the protocol
 */
export const MessageType = {
  // Connection lifecycle
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Client requests
  PING: 'ping',
  PONG: 'pong',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  REQUEST: 'request',
  
  // Server responses
  RESPONSE: 'response',
  ERROR: 'error',
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',
  
  // Data updates
  CONFIG_CHANGE: 'config-change',
  LOG_CHANGE: 'log-change',
  LOG_ADDED: 'log-added',
  LOG_REMOVED: 'log-removed',
  PROJECT_CONFIG_CHANGE: 'project-config-change',
  STATUS_UPDATE: 'status-update',
  METRICS_UPDATE: 'metrics-update',
  
  // Custom events
  CUSTOM: 'custom'
};

/**
 * Message Priority Levels
 */
export const MessagePriority = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3
};

/**
 * Subscription Channels
 * Defines available channels clients can subscribe to
 */
export const SubscriptionChannel = {
  CONFIG: 'config',
  LOGS: 'logs',
  METRICS: 'metrics',
  STATUS: 'status',
  ALL: '*'
};

/**
 * Base Message Class
 * All protocol messages extend this base class
 */
class ProtocolMessage {
  constructor(type, data = {}, options = {}) {
    this.version = '1.0.0';
    this.type = type;
    this.id = options.id || this.generateMessageId();
    this.timestamp = options.timestamp || Date.now();
    this.priority = options.priority || MessagePriority.NORMAL;
    this.data = data;
    
    // Optional fields
    if (options.correlationId) {
      this.correlationId = options.correlationId;
    }
    if (options.channel) {
      this.channel = options.channel;
    }
  }

  /**
   * Generate unique message ID
   * @returns {string} Unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert message to plain object for JSON serialization
   * @returns {Object} Plain object representation
   */
  toJSON() {
    const obj = {
      version: this.version,
      type: this.type,
      id: this.id,
      timestamp: this.timestamp,
      priority: this.priority,
      data: this.data
    };

    if (this.correlationId) {
      obj.correlationId = this.correlationId;
    }
    if (this.channel) {
      obj.channel = this.channel;
    }

    return obj;
  }

  /**
   * Validate message structure
   * @returns {Object} Validation result
   */
  validate() {
    const errors = [];

    if (!this.type) {
      errors.push('Message type is required');
    }

    if (!this.timestamp) {
      errors.push('Timestamp is required');
    }

    if (typeof this.data !== 'object') {
      errors.push('Data must be an object');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Connection Message
 * Sent when client connects or server acknowledges connection
 */
export class ConnectionMessage extends ProtocolMessage {
  constructor(data, options = {}) {
    super(MessageType.CONNECTION, {
      clientId: data.clientId,
      serverVersion: data.serverVersion || '1.0.0',
      timestamp: Date.now(),
      ...data
    }, options);
  }
}

/**
 * Subscribe Message
 * Client subscribes to specific channels
 */
export class SubscribeMessage extends ProtocolMessage {
  constructor(channel, options = {}) {
    super(MessageType.SUBSCRIBE, {
      channel
    }, { ...options, channel });
  }

  validate() {
    const baseValidation = super.validate();
    if (!this.data.channel) {
      baseValidation.errors.push('Channel is required for subscription');
      baseValidation.valid = false;
    }
    return baseValidation;
  }
}

/**
 * Unsubscribe Message
 * Client unsubscribes from specific channels
 */
export class UnsubscribeMessage extends ProtocolMessage {
  constructor(channel, options = {}) {
    super(MessageType.UNSUBSCRIBE, {
      channel
    }, { ...options, channel });
  }
}

/**
 * Request Message
 * Client requests specific data or action
 */
export class RequestMessage extends ProtocolMessage {
  constructor(requestType, params = {}, options = {}) {
    super(MessageType.REQUEST, {
      requestType,
      params
    }, options);
  }
}

/**
 * Response Message
 * Server responds to client request
 */
export class ResponseMessage extends ProtocolMessage {
  constructor(data, options = {}) {
    super(MessageType.RESPONSE, {
      success: data.success !== undefined ? data.success : true,
      ...data
    }, options);
  }
}

/**
 * Error Message
 * Sent when an error occurs
 */
export class ErrorMessage extends ProtocolMessage {
  constructor(error, options = {}) {
    const errorData = {
      message: error.message || error,
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details || {}
    };

    super(MessageType.ERROR, errorData, {
      ...options,
      priority: MessagePriority.HIGH
    });
  }
}

/**
 * Config Change Message
 * Sent when configuration file changes
 */
export class ConfigChangeMessage extends ProtocolMessage {
  constructor(configData, options = {}) {
    super(MessageType.CONFIG_CHANGE, {
      path: configData.path,
      filename: configData.filename,
      config: configData.config,
      previousConfig: configData.previousConfig
    }, { ...options, channel: SubscriptionChannel.CONFIG });
  }
}

/**
 * Log Change Message
 * Sent when log file changes
 */
export class LogChangeMessage extends ProtocolMessage {
  constructor(logData, options = {}) {
    super(MessageType.LOG_CHANGE, {
      path: logData.path,
      filename: logData.filename,
      directory: logData.directory,
      recentContent: logData.recentContent,
      lineCount: logData.lineCount
    }, { ...options, channel: SubscriptionChannel.LOGS });
  }
}

/**
 * Status Update Message
 * Sent for system status updates
 */
export class StatusUpdateMessage extends ProtocolMessage {
  constructor(statusData, options = {}) {
    super(MessageType.STATUS_UPDATE, {
      component: statusData.component,
      status: statusData.status,
      message: statusData.message,
      details: statusData.details || {}
    }, { ...options, channel: SubscriptionChannel.STATUS });
  }
}

/**
 * Metrics Update Message
 * Sent for system metrics updates
 */
export class MetricsUpdateMessage extends ProtocolMessage {
  constructor(metricsData, options = {}) {
    super(MessageType.METRICS_UPDATE, {
      metrics: metricsData.metrics,
      interval: metricsData.interval,
      aggregation: metricsData.aggregation
    }, { ...options, channel: SubscriptionChannel.METRICS });
  }
}

/**
 * Protocol Serializer
 * Handles serialization of messages to JSON
 */
export class ProtocolSerializer {
  /**
   * Serialize a message to JSON string
   * @param {ProtocolMessage} message - Message to serialize
   * @returns {string} JSON string
   */
  static serialize(message) {
    try {
      if (message instanceof ProtocolMessage) {
        // Use the message's toJSON method which returns a plain object
        return JSON.stringify(message.toJSON());
      }
      
      // Handle plain objects
      return JSON.stringify(message);
    } catch (error) {
      logger.error('Error serializing message:', error);
      throw new Error(`Serialization failed: ${error.message}`);
    }
  }

  /**
   * Serialize multiple messages
   * @param {Array<ProtocolMessage>} messages - Array of messages
   * @returns {string} JSON string
   */
  static serializeBatch(messages) {
    try {
      return JSON.stringify(messages.map(msg => 
        msg instanceof ProtocolMessage ? msg.toJSON() : msg
      ));
    } catch (error) {
      logger.error('Error serializing batch:', error);
      throw new Error(`Batch serialization failed: ${error.message}`);
    }
  }
}

/**
 * Protocol Deserializer
 * Handles deserialization of JSON to message objects
 */
export class ProtocolDeserializer {
  /**
   * Deserialize JSON string to message object
   * @param {string} jsonString - JSON string to deserialize
   * @returns {Object} Parsed message object
   */
  static deserialize(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Validate basic structure
      if (!parsed.type) {
        throw new Error('Message type is required');
      }

      return parsed;
    } catch (error) {
      logger.error('Error deserializing message:', error);
      throw new Error(`Deserialization failed: ${error.message}`);
    }
  }

  /**
   * Deserialize and create typed message instance
   * @param {string} jsonString - JSON string to deserialize
   * @returns {ProtocolMessage} Typed message instance
   */
  static deserializeToInstance(jsonString) {
    const parsed = this.deserialize(jsonString);
    
    // Map to appropriate class based on type
    const messageClasses = {
      [MessageType.CONNECTION]: ConnectionMessage,
      [MessageType.SUBSCRIBE]: SubscribeMessage,
      [MessageType.UNSUBSCRIBE]: UnsubscribeMessage,
      [MessageType.REQUEST]: RequestMessage,
      [MessageType.RESPONSE]: ResponseMessage,
      [MessageType.ERROR]: ErrorMessage,
      [MessageType.CONFIG_CHANGE]: ConfigChangeMessage,
      [MessageType.LOG_CHANGE]: LogChangeMessage,
      [MessageType.STATUS_UPDATE]: StatusUpdateMessage,
      [MessageType.METRICS_UPDATE]: MetricsUpdateMessage
    };

    const MessageClass = messageClasses[parsed.type];
    if (!MessageClass) {
      // Return generic ProtocolMessage for unknown types
      return new ProtocolMessage(parsed.type, parsed.data, {
        id: parsed.id,
        timestamp: parsed.timestamp,
        priority: parsed.priority,
        channel: parsed.channel,
        correlationId: parsed.correlationId
      });
    }

    // Reconstruct typed message
    const message = Object.create(MessageClass.prototype);
    return Object.assign(message, parsed);
  }

  /**
   * Deserialize batch of messages
   * @param {string} jsonString - JSON array string
   * @returns {Array<Object>} Array of parsed messages
   */
  static deserializeBatch(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        throw new Error('Batch must be an array');
      }
      return parsed;
    } catch (error) {
      logger.error('Error deserializing batch:', error);
      throw new Error(`Batch deserialization failed: ${error.message}`);
    }
  }
}

/**
 * Protocol Validator
 * Validates messages against protocol specification
 */
export class ProtocolValidator {
  /**
   * Validate a message
   * @param {Object|ProtocolMessage} message - Message to validate
   * @returns {Object} Validation result
   */
  static validate(message) {
    if (message instanceof ProtocolMessage) {
      return message.validate();
    }

    const errors = [];

    // Required fields
    if (!message.type) {
      errors.push('type is required');
    }
    if (!message.timestamp) {
      errors.push('timestamp is required');
    }
    if (!message.data || typeof message.data !== 'object') {
      errors.push('data must be an object');
    }

    // Optional but validated if present
    if (message.version && typeof message.version !== 'string') {
      errors.push('version must be a string');
    }
    if (message.priority !== undefined && !Object.values(MessagePriority).includes(message.priority)) {
      errors.push('invalid priority level');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate message type
   * @param {string} type - Message type to validate
   * @returns {boolean} True if valid type
   */
  static isValidType(type) {
    return Object.values(MessageType).includes(type);
  }

  /**
   * Validate subscription channel
   * @param {string} channel - Channel to validate
   * @returns {boolean} True if valid channel
   */
  static isValidChannel(channel) {
    return Object.values(SubscriptionChannel).includes(channel);
  }
}

/**
 * Protocol Builder
 * Fluent API for building protocol messages
 */
export class ProtocolBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this._type = null;
    this._data = {};
    this._options = {};
    return this;
  }

  type(type) {
    this._type = type;
    return this;
  }

  data(data) {
    this._data = { ...this._data, ...data };
    return this;
  }

  channel(channel) {
    this._options.channel = channel;
    return this;
  }

  priority(priority) {
    this._options.priority = priority;
    return this;
  }

  correlationId(id) {
    this._options.correlationId = id;
    return this;
  }

  build() {
    if (!this._type) {
      throw new Error('Message type is required');
    }

    const message = new ProtocolMessage(this._type, this._data, this._options);
    this.reset();
    return message;
  }

  buildAndSerialize() {
    return ProtocolSerializer.serialize(this.build());
  }
}

// Export default instance of builder for convenience
export const builder = new ProtocolBuilder();

/**
 * Create a protocol message helper
 * Factory functions for common message types
 */
export const createMessage = {
  connection: (clientId, serverVersion = '1.0.0') => 
    new ConnectionMessage({ clientId, serverVersion }),
  
  subscribe: (channel) => 
    new SubscribeMessage(channel),
  
  unsubscribe: (channel) => 
    new UnsubscribeMessage(channel),
  
  request: (requestType, params = {}, correlationId) => 
    new RequestMessage(requestType, params, { correlationId }),
  
  response: (data, correlationId) => 
    new ResponseMessage(data, { correlationId }),
  
  error: (error, correlationId) => 
    new ErrorMessage(error, { correlationId }),
  
  configChange: (configData) => 
    new ConfigChangeMessage(configData),
  
  logChange: (logData) => 
    new LogChangeMessage(logData),
  
  statusUpdate: (statusData) => 
    new StatusUpdateMessage(statusData),
  
  metricsUpdate: (metricsData) => 
    new MetricsUpdateMessage(metricsData),
  
  ping: () => 
    new ProtocolMessage(MessageType.PING, {}),
  
  pong: () => 
    new ProtocolMessage(MessageType.PONG, { timestamp: Date.now() })
};

export default {
  MessageType,
  MessagePriority,
  SubscriptionChannel,
  ProtocolMessage,
  ProtocolSerializer,
  ProtocolDeserializer,
  ProtocolValidator,
  ProtocolBuilder,
  builder,
  createMessage
};

