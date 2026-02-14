const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const User = require('../models/User');
const admin = require('../utils/firebase');
const features = require('../config/features');
const { generateToken, authenticate } = require('../middleware/auth');
const {
  handleValidation,
  nameValidation,
  phoneValidation,
  otpValidation,
  firebaseTokenValidation
} = require('../middleware/validators');

// Rate limiter for auth verify — 10 req/min per IP
const authVerifyLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts. Try again in a minute.' }
});

/**
 * GET /api/auth/config
 * Returns current auth mode (public)
 */
router.get('/config', (req, res) => {
  res.json({ authMode: features.firebase ? 'firebase' : 'mock' });
});

if (features.firebase) {
  /**
   * POST /api/auth/firebase-verify
   * Verify Firebase ID token, create/find user, return app JWT
   */
  router.post('/firebase-verify',
    authVerifyLimiter,
    firebaseTokenValidation,
    handleValidation,
    async (req, res) => {
      try {
        const { idToken, name } = req.body;

        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decodedToken.uid;
        const phoneNumber = decodedToken.phone_number;

        if (!phoneNumber) {
          return res.status(400).json({ error: 'Phone number not found in Firebase token' });
        }

        // Strip country code (+91) to get 10-digit number
        const phone = phoneNumber.replace(/^\+91/, '');

        // Try to find user by Firebase UID first, then by phone
        let user = await User.findOne({ firebaseUid });
        let isNewUser = false;

        if (!user) {
          user = await User.findByPhone(phone);
        }

        if (!user) {
          // New user — name is required for registration
          if (!name) {
            return res.status(200).json({
              success: true,
              isNewUser: true,
              message: 'New user. Name required for registration.'
            });
          }

          user = new User({
            name,
            phone,
            firebaseUid,
            isVerified: true
          });
          await user.save();
          isNewUser = true;
        } else {
          // Link Firebase UID if not already linked
          if (!user.firebaseUid) {
            user.firebaseUid = firebaseUid;
          }
          user.lastLogin = new Date();
          await user.save();
        }

        const token = generateToken(user._id);

        res.json({
          success: true,
          token,
          isNewUser,
          user: {
            id: user._id,
            name: user.name,
            phone: user.getPhone(),
            isVerified: user.isVerified
          }
        });
      } catch (error) {
        console.error('Firebase verify error:', error.message);

        if (error.code === 'auth/id-token-expired') {
          return res.status(401).json({ error: 'Firebase token expired. Please try again.' });
        }
        if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-revoked') {
          return res.status(401).json({ error: 'Invalid Firebase token.' });
        }

        res.status(500).json({ error: 'Verification failed' });
      }
    }
  );
} else {
  /**
   * POST /api/auth/mock-send-otp
   * Validates phone number, returns success (no SMS sent)
   */
  router.post('/mock-send-otp',
    authVerifyLimiter,
    phoneValidation,
    handleValidation,
    (req, res) => {
      res.json({ success: true, message: 'Mock OTP sent (dev mode)' });
    }
  );

  /**
   * POST /api/auth/mock-verify
   * Accepts phone + any 6-digit OTP + optional name, creates/finds user, returns JWT
   */
  router.post('/mock-verify',
    authVerifyLimiter,
    phoneValidation,
    otpValidation,
    handleValidation,
    async (req, res) => {
      try {
        const { phone, name } = req.body;

        let user = await User.findByPhone(phone);
        let isNewUser = false;

        if (!user) {
          if (!name) {
            return res.status(200).json({
              success: true,
              isNewUser: true,
              message: 'New user. Name required for registration.'
            });
          }

          user = new User({
            name,
            phone,
            isVerified: true
          });
          await user.save();
          isNewUser = true;
        } else {
          user.lastLogin = new Date();
          await user.save();
        }

        const token = generateToken(user._id);

        res.json({
          success: true,
          token,
          isNewUser,
          user: {
            id: user._id,
            name: user.name,
            phone: user.getPhone(),
            isVerified: user.isVerified
          }
        });
      } catch (error) {
        console.error('Mock verify error:', error.message);
        res.status(500).json({ error: 'Verification failed' });
      }
    }
  );
}

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      phone: req.user.getPhone(),
      isVerified: req.user.isVerified,
      role: req.user.role,
      hasEmergencyContact: !!(req.user.emergencyContact?.phoneHash),
      emergencyContactName: req.user.emergencyContact?.name || null
    });
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile',
  authenticate,
  nameValidation,
  handleValidation,
  async (req, res) => {
    try {
      const { name } = req.body;

      req.user.name = name;
      await req.user.save();

      res.json({
        success: true,
        user: {
          id: req.user._id,
          name: req.user.name,
          phone: req.user.getPhone()
        }
      });
    } catch (error) {
      console.error('Update profile error:', error.message);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

/**
 * PUT /api/auth/emergency-contact
 * Set or update emergency contact
 */
router.put('/emergency-contact',
  authenticate,
  [
    require('express-validator').body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    require('express-validator').body('phone')
      .trim()
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Invalid phone number. Use 10 digit Indian mobile number')
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { name, phone } = req.body;
      req.user.emergencyContact = { name };
      req.user.setEmergencyPhone(phone);
      await req.user.save();

      const maskedPhone = phone.slice(0, 2) + '****' + phone.slice(-2);
      res.json({
        success: true,
        emergencyContact: {
          name,
          maskedPhone: `+91 ${maskedPhone}`
        }
      });
    } catch (error) {
      console.error('Set emergency contact error:', error.message);
      res.status(500).json({ error: 'Failed to set emergency contact' });
    }
  }
);

/**
 * DELETE /api/auth/emergency-contact
 * Remove emergency contact
 */
router.delete('/emergency-contact', authenticate, async (req, res) => {
  try {
    req.user.emergencyContact = undefined;
    await req.user.save();
    res.json({ success: true, message: 'Emergency contact removed' });
  } catch (error) {
    console.error('Delete emergency contact error:', error.message);
    res.status(500).json({ error: 'Failed to remove emergency contact' });
  }
});

/**
 * POST /api/auth/fcm-token
 * Register FCM token for push notifications
 */
router.post('/fcm-token',
  authenticate,
  [
    require('express-validator').body('token')
      .isString()
      .notEmpty()
      .withMessage('FCM token is required'),
    require('express-validator').body('platform')
      .optional()
      .isIn(['web', 'android', 'ios'])
      .withMessage('Invalid platform')
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { token, platform = 'web' } = req.body;

      // Deduplicate: remove existing token if present
      req.user.fcmTokens = req.user.fcmTokens.filter(t => t.token !== token);
      req.user.fcmTokens.push({ token, platform });

      // Keep max 10 tokens per user
      if (req.user.fcmTokens.length > 10) {
        req.user.fcmTokens = req.user.fcmTokens.slice(-10);
      }

      await req.user.save();
      res.json({ success: true, message: 'FCM token registered' });
    } catch (error) {
      console.error('FCM token registration error:', error.message);
      res.status(500).json({ error: 'Failed to register FCM token' });
    }
  }
);

/**
 * DELETE /api/auth/fcm-token
 * Remove FCM token
 */
router.delete('/fcm-token',
  authenticate,
  [
    require('express-validator').body('token')
      .isString()
      .notEmpty()
      .withMessage('FCM token is required')
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { token } = req.body;
      req.user.fcmTokens = req.user.fcmTokens.filter(t => t.token !== token);
      await req.user.save();
      res.json({ success: true, message: 'FCM token removed' });
    } catch (error) {
      console.error('FCM token removal error:', error.message);
      res.status(500).json({ error: 'Failed to remove FCM token' });
    }
  }
);

module.exports = router;
