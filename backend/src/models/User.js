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
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Encrypt phone before saving
userSchema.pre('save', function(next) {
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

// Static method to find by phone
userSchema.statics.findByPhone = async function(phone) {
  const crypto = require('crypto');
  const phoneHash = crypto.createHash('sha256').update(phone).digest('hex');
  return this.findOne({ phoneHash });
};

module.exports = mongoose.model('User', userSchema);
