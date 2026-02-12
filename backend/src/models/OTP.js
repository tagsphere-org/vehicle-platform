const mongoose = require('mongoose');

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

// Verify OTP
otpSchema.methods.verify = function(inputOtp) {
  if (this.isUsed) {
    return { valid: false, error: 'OTP already used' };
  }
  if (this.attempts >= this.maxAttempts) {
    return { valid: false, error: 'Maximum attempts exceeded' };
  }
  if (new Date() > this.expiresAt) {
    return { valid: false, error: 'OTP expired' };
  }

  this.attempts += 1;

  if (this.otp !== inputOtp) {
    return { valid: false, error: 'Invalid OTP' };
  }

  this.isUsed = true;
  return { valid: true };
};

// Generate OTP
otpSchema.statics.generate = async function(phone, purpose = 'login') {
  // Delete any existing OTPs for this phone
  await this.deleteMany({ phone, purpose });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Create new OTP (expires in 10 minutes)
  const otpDoc = await this.create({
    phone,
    otp,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });

  return otp;
};

module.exports = mongoose.model('OTP', otpSchema);
