const { customAlphabet } = require('nanoid');

// Custom alphabet without confusing characters (0, O, I, l)
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

// Generate 7-character QR IDs (34^7 = 52 billion combinations)
const generateQrId = customAlphabet(ALPHABET, 7);

// Generate 6-digit activation PIN
const generatePin = customAlphabet('0123456789', 6);

/**
 * Generate a batch of unique QR IDs
 * @param {number} count - Number of IDs to generate
 * @returns {Array} - Array of {qrId, activationPin} objects
 */
function generateBatch(count = 100) {
  const batch = [];
  const seen = new Set();

  while (batch.length < count) {
    const qrId = generateQrId();
    if (!seen.has(qrId)) {
      seen.add(qrId);
      batch.push({
        qrId,
        activationPin: generatePin()
      });
    }
  }

  return batch;
}

module.exports = {
  generateQrId,
  generatePin,
  generateBatch
};
