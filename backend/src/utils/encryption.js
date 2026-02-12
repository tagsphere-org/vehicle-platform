const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }
  return crypto.scryptSync(key, 'tagsphere-salt', 32);
}

/**
 * Encrypt sensitive data using AES-256-GCM with random IV
 * @param {string} text - Plain text to encrypt
 * @returns {string} - iv:authTag:ciphertext (hex encoded)
 */
function encrypt(text) {
  if (!text) return text;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 * @param {string} ciphertext - iv:authTag:encrypted (hex encoded)
 * @returns {string} - Decrypted plain text
 */
function decrypt(ciphertext) {
  if (!ciphertext) return ciphertext;
  const key = getKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Hash data (one-way, for lookups)
 * @param {string} text - Text to hash
 * @returns {string} - SHA256 hash
 */
function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  hash
};
