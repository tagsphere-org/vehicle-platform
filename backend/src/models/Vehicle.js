const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  qrCodeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  activatedAt: {
    type: Date,
    default: Date.now
  },
  deactivatedAt: {
    type: Date
  },
  // Optional vehicle details
  vehicleType: {
    type: String,
    enum: ['car', 'bike', 'truck', 'auto', 'other'],
    default: 'car'
  },
  vehicleColor: {
    type: String,
    trim: true
  },
  // Statistics
  totalScans: {
    type: Number,
    default: 0
  },
  lastScannedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index for user's vehicles
vehicleSchema.index({ user: 1, isActive: 1 });

// Method to increment scan count
vehicleSchema.methods.recordScan = async function() {
  this.totalScans += 1;
  this.lastScannedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Vehicle', vehicleSchema);
