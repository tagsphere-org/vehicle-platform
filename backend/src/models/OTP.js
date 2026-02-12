const mongoose = require('mongoose');
const crypto = require('crypto');

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['registration', 'login', 'reset'],
    default: 'login'
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Verify OTP with timing-safe comparison
otpSchema.methods.verify = function(inputOtp) {
  if (this.isUsed) {
    return { valid: false, error: 'OTP already used' };
  }
  if (this.attempts >= this.maxAttempts) {
    return { valid: false, error: 'Maximum attempts exceeded. Request a new OTP.' };
  }
  if (new Date() > this.expiresAt) {
    return { valid: false, error: 'OTP expired' };
  }

  this.attempts += 1;

  // Timing-safe comparison to prevent timing attacks
  const stored = Buffer.alloc(6, 0);
  const input = Buffer.alloc(6, 0);
  stored.write(String(this.otp).slice(0, 6));
  input.write(String(inputOtp).slice(0, 6));
  if (!crypto.timingSafeEqual(stored, input)) {
    return { valid: false, error: 'Invalid OTP' };
  }

  this.isUsed = true;
  return { valid: true };
};

// Generate OTP using crypto.randomInt (cryptographically secure)
otpSchema.statics.generate = async function(phone, purpose = 'login') {
  // Delete any existing OTPs for this phone
  await this.deleteMany({ phone, purpose });

  // Generate 6-digit OTP using cryptographically secure random
  const otp = crypto.randomInt(100000, 999999).toString();

  // Create new OTP (expires in 5 minutes)
  await this.create({
    phone,
    otp,
    purpose,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  return otp;
};

module.exports = mongoose.model('OTP', otpSchema);
