const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const features = require('../config/features');
const { authenticate } = require('../middleware/auth');
const Subscription = require('../models/Subscription');

const PLANS = {
  basic: {
    name: 'Basic',
    amount: 14900, // in paise (₹149)
    currency: 'INR',
    credits: { notifications: 25, calls: 25 },
    features: ['25 notification credits/month', '25 call credits/month', 'Scan activity history']
  },
  premium: {
    name: 'Premium',
    amount: 29900, // in paise (₹299)
    currency: 'INR',
    credits: { notifications: 50, calls: 50 },
    features: ['50 notification credits/month', '50 call credits/month', 'Priority support', 'Advanced scan analytics']
  }
};

let getRazorpayInstance;
if (features.razorpay) {
  const Razorpay = require('razorpay');
  getRazorpayInstance = () => new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

/**
 * GET /api/subscription/plans
 * Return available plans (public)
 */
router.get('/plans', (req, res) => {
  res.json({
    paymentsEnabled: features.razorpay,
    callsEnabled: features.calls,
    notificationsEnabled: features.notifications,
    plans: {
      free: {
        name: 'Free',
        amount: 0,
        currency: 'INR',
        credits: { notifications: 0, calls: 0 },
        features: ['Register vehicles', 'QR code generation', 'Basic scan alerts']
      },
      ...PLANS
    }
  });
});

/**
 * GET /api/subscription/my-plan
 * Get user's current subscription (auth required)
 */
router.get('/my-plan', authenticate, async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ user: req.user._id });

    if (!subscription) {
      subscription = await Subscription.create({ user: req.user._id, plan: 'free' });
    }

    // Check if subscription has expired
    if (subscription.plan !== 'free' && subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) {
      subscription.status = 'expired';
      await subscription.save();
    }

    res.json({
      plan: subscription.plan,
      status: subscription.status,
      amount: subscription.amount,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      isActive: subscription.plan === 'free' ? true : subscription.isActive()
    });
  } catch (error) {
    console.error('Get plan error:', error.message);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

if (features.razorpay) {
  /**
   * POST /api/subscription/create-order
   * Create Razorpay order for a plan (auth required)
   */
  router.post('/create-order', authenticate, async (req, res) => {
    try {
      const { plan } = req.body;

      if (!plan || !PLANS[plan]) {
        return res.status(400).json({ error: 'Invalid plan. Choose basic or premium.' });
      }

      const razorpay = getRazorpayInstance();
      const planDetails = PLANS[plan];

      const order = await razorpay.orders.create({
        amount: planDetails.amount,
        currency: planDetails.currency,
        receipt: `sub_${req.user._id}_${Date.now()}`,
        notes: {
          userId: req.user._id.toString(),
          plan: plan
        }
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      });
    } catch (error) {
      console.error('Create order error:', error.message);
      res.status(500).json({ error: 'Failed to create payment order' });
    }
  });

  /**
   * POST /api/subscription/verify-payment
   * Verify Razorpay payment and activate subscription (auth required)
   */
  router.post('/verify-payment', authenticate, async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
        return res.status(400).json({ error: 'Missing payment verification fields' });
      }

      if (!PLANS[plan]) {
        return res.status(400).json({ error: 'Invalid plan' });
      }

      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment verification failed' });
      }

      // Create or update subscription
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      const subscription = await Subscription.findOneAndUpdate(
        { user: req.user._id },
        {
          plan: plan,
          status: 'active',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          amount: PLANS[plan].amount,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd
        },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      });
    } catch (error) {
      console.error('Verify payment error:', error.message);
      res.status(500).json({ error: 'Failed to verify payment' });
    }
  });
} else {
  // Stub payment endpoints when Razorpay is disabled
  router.post('/create-order', authenticate, (req, res) => {
    res.status(503).json({ error: 'Payments not configured' });
  });

  router.post('/verify-payment', authenticate, (req, res) => {
    res.status(503).json({ error: 'Payments not configured' });
  });
}

module.exports = router;
