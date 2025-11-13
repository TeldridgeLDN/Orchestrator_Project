/**
 * Encryption and Security Module for Cloud Sync
 * 
 * Handles client-side encryption/decryption of configuration data
 * using AES-256-GCM with secure key management.
 * 
 * @module utils/sync-encryption
 */

import crypto from 'crypto';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Encryption Configuration
 */
export const EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 16,  // 128 bits
  saltLength: 32,
  tagLength: 16,
  iterations: 100000, // PBKDF2 iterations
  hashAlgorithm: 'sha256'
};

/**
 * Encrypted Data Structure
 */
export class EncryptedData {
  constructor({ data, iv, authTag, algorithm, keyId, salt }) {
    this.data = data;        // Base64 encoded encrypted data
    this.iv = iv;            // Base64 encoded initialization vector
    this.authTag = authTag;  // Base64 encoded authentication tag
    this.algorithm = algorithm;
    this.keyId = keyId;      // Reference to encryption key
    this.salt = salt;        // Base64 encoded salt (for key derivation)
    this.timestamp = Date.now();
  }
  
  toJSON() {
    return {
      data: this.data,
      iv: this.iv,
      authTag: this.authTag,
      algorithm: this.algorithm,
      keyId: this.keyId,
      salt: this.salt,
      timestamp: this.timestamp
    };
  }
  
  static fromJSON(json) {
    return new EncryptedData(json);
  }
}

/**
 * Key Storage Path
 * Uses OS-specific secure locations
 */
function getKeyStoragePath() {
  const homeDir = os.homedir();
  
  switch (os.platform()) {
    case 'darwin': // macOS
      return path.join(homeDir, 'Library', 'Application Support', 'diet103', 'keys');
    case 'win32': // Windows
      return path.join(homeDir, 'AppData', 'Local', 'diet103', 'keys');
    default: // Linux and others
      return path.join(homeDir, '.diet103', 'keys');
  }
}

/**
 * Generate encryption key from passphrase
 * Uses PBKDF2 for key derivation
 */
export function deriveKey(passphrase, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      passphrase,
      salt,
      EncryptionConfig.iterations,
      EncryptionConfig.keyLength,
      EncryptionConfig.hashAlgorithm,
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      }
    );
  });
}

/**
 * Generate random encryption key
 */
export function generateKey() {
  return crypto.randomBytes(EncryptionConfig.keyLength);
}

/**
 * Generate random salt
 */
export function generateSalt() {
  return crypto.randomBytes(EncryptionConfig.saltLength);
}

/**
 * Store encryption key securely
 * In production, this should use OS keychain/keystore
 */
export async function storeKey(keyId, key) {
  const keyDir = getKeyStoragePath();
  
  // Ensure directory exists
  if (!existsSync(keyDir)) {
    await fs.mkdir(keyDir, { recursive: true, mode: 0o700 });
  }
  
  const keyPath = path.join(keyDir, `${keyId}.key`);
  
  // Store key with restricted permissions
  await fs.writeFile(keyPath, key, { mode: 0o600 });
  
  console.log(`Key stored securely at: ${keyPath}`);
  return keyPath;
}

/**
 * Retrieve encryption key
 */
export async function retrieveKey(keyId) {
  const keyDir = getKeyStoragePath();
  const keyPath = path.join(keyDir, `${keyId}.key`);
  
  if (!existsSync(keyPath)) {
    throw new Error(`Encryption key not found: ${keyId}`);
  }
  
  return await fs.readFile(keyPath);
}

/**
 * Delete encryption key
 */
export async function deleteKey(keyId) {
  const keyDir = getKeyStoragePath();
  const keyPath = path.join(keyDir, `${keyId}.key`);
  
  if (existsSync(keyPath)) {
    await fs.unlink(keyPath);
  }
}

/**
 * List all stored keys
 */
export async function listKeys() {
  const keyDir = getKeyStoragePath();
  
  if (!existsSync(keyDir)) {
    return [];
  }
  
  const files = await fs.readdir(keyDir);
  return files
    .filter(f => f.endsWith('.key'))
    .map(f => f.replace('.key', ''));
}

/**
 * Encrypt configuration data
 */
export function encryptConfig(config, key) {
  // Generate IV for this encryption
  const iv = crypto.randomBytes(EncryptionConfig.ivLength);
  
  // Create cipher
  const cipher = crypto.createCipheriv(
    EncryptionConfig.algorithm,
    key,
    iv
  );
  
  // Encrypt config JSON
  const configString = JSON.stringify(config);
  let encrypted = cipher.update(configString, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  return {
    data: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

/**
 * Decrypt configuration data
 */
export function decryptConfig(encryptedData, key) {
  // Create decipher
  const decipher = crypto.createDecipheriv(
    EncryptionConfig.algorithm,
    key,
    Buffer.from(encryptedData.iv, 'base64')
  );
  
  // Set authentication tag
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));
  
  // Decrypt data
  let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  // Parse JSON
  return JSON.parse(decrypted);
}

/**
 * Encrypt config with automatic key management
 */
export async function encryptConfigWithKeyManagement(config, userId, keyId = null) {
  // Generate or retrieve key
  if (!keyId) {
    keyId = `${userId}-${Date.now()}`;
  }
  
  let key;
  try {
    key = await retrieveKey(keyId);
  } catch (err) {
    // Key doesn't exist, generate new one
    key = generateKey();
    await storeKey(keyId, key);
  }
  
  // Generate salt for key derivation (future use)
  const salt = generateSalt();
  
  // Encrypt config
  const encrypted = encryptConfig(config, key);
  
  return new EncryptedData({
    ...encrypted,
    algorithm: EncryptionConfig.algorithm,
    keyId,
    salt: salt.toString('base64')
  });
}

/**
 * Decrypt config with automatic key retrieval
 */
export async function decryptConfigWithKeyManagement(encryptedData) {
  // Retrieve key
  const key = await retrieveKey(encryptedData.keyId);
  
  // Decrypt config
  return decryptConfig(encryptedData, key);
}

/**
 * Calculate hash of configuration for integrity checking
 */
export function calculateHash(config) {
  const configString = JSON.stringify(config, Object.keys(config).sort());
  return crypto.createHash(EncryptionConfig.hashAlgorithm)
    .update(configString)
    .digest('hex');
}

/**
 * Verify integrity of decrypted config
 */
export function verifyIntegrity(config, expectedHash) {
  const actualHash = calculateHash(config);
  
  if (actualHash !== expectedHash) {
    throw new Error('Configuration integrity check failed');
  }
  
  return true;
}

/**
 * Encrypt and prepare for cloud upload
 */
export async function prepareForUpload(config, userId, keyId = null) {
  // Calculate hash before encryption
  const hash = calculateHash(config);
  
  // Encrypt config
  const encrypted = await encryptConfigWithKeyManagement(config, userId, keyId);
  
  // Calculate size
  const size = JSON.stringify(config).length;
  
  return {
    encryptedData: encrypted,
    hash,
    size,
    timestamp: Date.now()
  };
}

/**
 * Decrypt and verify data from cloud
 */
export async function processDownload(encryptedData, expectedHash) {
  // Decrypt config
  const config = await decryptConfigWithKeyManagement(encryptedData);
  
  // Verify integrity
  if (expectedHash) {
    verifyIntegrity(config, expectedHash);
  }
  
  return config;
}

/**
 * Rotate encryption key
 * Creates new key and re-encrypts data
 */
export async function rotateKey(config, userId, oldKeyId) {
  // Generate new key ID
  const newKeyId = `${userId}-${Date.now()}`;
  
  // Generate and store new key
  const newKey = generateKey();
  await storeKey(newKeyId, newKey);
  
  // Re-encrypt config with new key
  const encrypted = await encryptConfigWithKeyManagement(config, userId, newKeyId);
  
  // Optionally delete old key
  // await deleteKey(oldKeyId);
  
  return {
    newKeyId,
    encrypted
  };
}

/**
 * Initialize encryption for user
 * Sets up key storage and generates initial key
 */
export async function initializeEncryption(userId, passphrase = null) {
  const keyId = `${userId}-master`;
  
  // Check if key already exists
  try {
    await retrieveKey(keyId);
    console.log('Encryption already initialized');
    return { keyId, existing: true };
  } catch (err) {
    // Key doesn't exist, create it
  }
  
  // Generate or derive key
  let key;
  if (passphrase) {
    const salt = generateSalt();
    key = await deriveKey(passphrase, salt);
    // Store salt for future key derivation
    await storeKey(`${keyId}-salt`, salt);
  } else {
    key = generateKey();
  }
  
  // Store key
  await storeKey(keyId, key);
  
  console.log('Encryption initialized successfully');
  return { keyId, existing: false };
}

/**
 * Test encryption/decryption
 */
export async function testEncryption(config, userId) {
  console.log('Testing encryption...');
  
  // Encrypt
  const encrypted = await encryptConfigWithKeyManagement(config, userId);
  console.log('Encryption successful');
  console.log('Encrypted data size:', encrypted.data.length);
  
  // Decrypt
  const decrypted = await decryptConfigWithKeyManagement(encrypted);
  console.log('Decryption successful');
  
  // Verify
  const hash1 = calculateHash(config);
  const hash2 = calculateHash(decrypted);
  
  if (hash1 === hash2) {
    console.log('✅ Encryption test passed - data integrity verified');
    return true;
  } else {
    console.log('❌ Encryption test failed - data mismatch');
    return false;
  }
}

/**
 * Security utilities
 */
export const SecurityUtils = {
  /**
   * Generate secure random string
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  },
  
  /**
   * Hash sensitive data (e.g., device ID)
   */
  hashSensitiveData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  },
  
  /**
   * Constant-time string comparison
   */
  secureCompare(a, b) {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
};

export default {
  EncryptionConfig,
  EncryptedData,
  deriveKey,
  generateKey,
  generateSalt,
  storeKey,
  retrieveKey,
  deleteKey,
  listKeys,
  encryptConfig,
  decryptConfig,
  encryptConfigWithKeyManagement,
  decryptConfigWithKeyManagement,
  calculateHash,
  verifyIntegrity,
  prepareForUpload,
  processDownload,
  rotateKey,
  initializeEncryption,
  testEncryption,
  SecurityUtils
};

