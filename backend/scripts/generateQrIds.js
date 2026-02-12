/**
 * Script to generate QR codes for printing
 *
 * Usage: npm run generate-qr-ids
 *
 * Output: CSV file with QR IDs and activation PINs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const QRCode = require('../src/models/QRCode');
const { generateBatch } = require('../src/utils/generateQrId');

const COUNT = parseInt(process.argv[2]) || 100;
const BATCH_ID = process.argv[3] || `BATCH-${Date.now()}`;

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Generate QR codes
    console.log(`Generating ${COUNT} QR codes...`);
    const batch = generateBatch(COUNT);

    // Check for duplicates
    const existingIds = await QRCode.find({
      qrId: { $in: batch.map(b => b.qrId) }
    }).select('qrId');

    const existingSet = new Set(existingIds.map(e => e.qrId));
    const newBatch = batch.filter(b => !existingSet.has(b.qrId));

    if (newBatch.length < COUNT) {
      console.warn(`Warning: ${COUNT - newBatch.length} duplicate IDs regenerated`);
    }

    // Insert into database
    const qrCodes = await QRCode.insertMany(
      newBatch.map(b => ({
        qrId: b.qrId,
        activationPin: b.activationPin,
        batchId: BATCH_ID
      }))
    );

    console.log(`Created ${qrCodes.length} QR codes in batch: ${BATCH_ID}`);

    // Generate CSV output
    const csvHeader = 'QR_ID,Activation_PIN,URL\n';
    const csvRows = qrCodes.map(qr =>
      `${qr.qrId},${qr.activationPin},https://tagsphere.co.in/v/${qr.qrId}`
    ).join('\n');

    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const filename = `qr-codes-${BATCH_ID}.csv`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, csvHeader + csvRows);
    console.log(`CSV saved to: ${filepath}`);

    // Print sample
    console.log('\nSample QR codes:');
    console.log('================');
    qrCodes.slice(0, 5).forEach(qr => {
      console.log(`${qr.qrId} | PIN: ${qr.activationPin} | https://tagsphere.co.in/v/${qr.qrId}`);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDone.');
  }
}

main();
