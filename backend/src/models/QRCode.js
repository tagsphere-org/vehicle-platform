const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  qrId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Activation PIN - required to activate QR
  activationPin: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'activated', 'disabled'],
    default: 'available',
    index: true
  },
  // Batch tracking for printing
  batchId: {
    type: String,
    index: true
  },
  // When was this QR generated
  generatedAt: {
    type: Date,
    default: Date.now
  },
  // When was it activated (linked to vehicle)
  activatedAt: {
    type: Date
  },
  // Who activated it
  activatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Static method to get available QR
qrCodeSchema.statics.getAvailable = function(qrId) {
  return this.findOne({ qrId, status: 'available' });
};

// Method to activate QR
qrCodeSchema.methods.activate = async function(userId, pin) {
  if (this.activationPin !== pin) {
    throw new Error('Invalid activation PIN');
  }
  if (this.status !== 'available') {
    throw new Error('QR code already activated or disabled');
  }

  this.status = 'activated';
  this.activatedAt = new Date();
  this.activatedBy = userId;
  return this.save();
};

module.exports = mongoose.model('QRCode', qrCodeSchema);
