const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  firebaseUid: {
    type: String,
    sparse: true,
    unique: true
  },
  phoneHash: {
    type: String,
    required: true,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  emergencyContact: {
    name: { type: String, trim: true, maxlength: 100 },
    phoneHash: { type: String },
    phoneEncrypted: { type: String }
  },
  fcmTokens: [{
    token: { type: String, required: true },
    platform: { type: String, enum: ['web', 'android', 'ios'], default: 'web' },
    createdAt: { type: Date, default: Date.now }
  }],
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Encrypt phone before validation so phoneHash is set for required check
userSchema.pre('validate', function(next) {
  if (this.isModified('phone')) {
    // Store hash for lookups, encrypted value for retrieval
    const crypto = require('crypto');
    this.phoneHash = crypto.createHash('sha256').update(this.phone).digest('hex');
    this.phone = encrypt(this.phone);
  }
  next();
});

// Method to get decrypted phone
userSchema.methods.getPhone = function() {
  return decrypt(this.phone);
};

// Set emergency phone (encrypts + hashes)
userSchema.methods.setEmergencyPhone = function(phone) {
  const crypto = require('crypto');
  this.emergencyContact.phoneHash = crypto.createHash('sha256').update(phone).digest('hex');
  this.emergencyContact.phoneEncrypted = encrypt(phone);
};

// Get decrypted emergency phone
userSchema.methods.getEmergencyPhone = function() {
  if (!this.emergencyContact?.phoneEncrypted) return null;
  return decrypt(this.emergencyContact.phoneEncrypted);
};

// Static method to find by phone
userSchema.statics.findByPhone = async function(phone) {
  const crypto = require('crypto');
  const phoneHash = crypto.createHash('sha256').update(phone).digest('hex');
  return this.findOne({ phoneHash });
};

module.exports = mongoose.model('User', userSchema);
