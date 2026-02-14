const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  razorpaySubscriptionId: {
    type: String,
    sparse: true
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  amount: {
    type: Number
  },
  currentPeriodStart: {
    type: Date
  },
  currentPeriodEnd: {
    type: Date
  }
}, {
  timestamps: true
});

subscriptionSchema.methods.isActive = function () {
  return this.status === 'active' && this.plan !== 'free' && this.currentPeriodEnd > new Date();
};

subscriptionSchema.methods.hasCallAccess = function () {
  return this.isActive() && this.plan === 'premium';
};

subscriptionSchema.methods.hasNotificationAccess = function () {
  return this.isActive() && (this.plan === 'basic' || this.plan === 'premium');
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
