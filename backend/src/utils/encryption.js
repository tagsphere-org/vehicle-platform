const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * Encrypt sensitive data (phone numbers)
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text
 */
function encrypt(text) {
  if (!text) return text;
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt sensitive data
 * @param {string} ciphertext - Encrypted text
 * @returns {string} - Decrypted plain text
 */
function decrypt(ciphertext) {
  if (!ciphertext) return ciphertext;
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Hash data (one-way, for lookups)
 * @param {string} text - Text to hash
 * @returns {string} - SHA256 hash
 */
function hash(text) {
  return CryptoJS.SHA256(text).toString();
}

module.exports = {
  encrypt,
  decrypt,
  hash
};
