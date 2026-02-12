const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema({
  qrCodeId: {
    type: String,
    required: true,
    index: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  // Action taken by scanner
  action: {
    type: String,
    enum: ['view', 'call', 'alert'],
    default: 'view'
  },
  // Scanner info (anonymized)
  scannerIp: {
    type: String
  },
  userAgent: {
    type: String
  },
  // Location (optional, if scanner allows)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: undefined
    }
  },
  // Alert message if action is 'alert'
  alertMessage: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Geospatial index for location queries
scanLogSchema.index({ location: '2dsphere' });

// Index for analytics
scanLogSchema.index({ createdAt: -1 });
scanLogSchema.index({ vehicle: 1, createdAt: -1 });

module.exports = mongoose.model('ScanLog', scanLogSchema);
