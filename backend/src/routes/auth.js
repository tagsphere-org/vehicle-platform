const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendOTP, verifyOTP } = require('../utils/otp');
const { generateToken, authenticate } = require('../middleware/auth');
const {
  handleValidation,
  phoneValidation,
  nameValidation,
  otpValidation
} = require('../middleware/validators');

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number
 */
router.post('/send-otp',
  phoneValidation,
  handleValidation,
  async (req, res) => {
    try {
      const { phone } = req.body;

      // Check if user exists
      const existingUser = await User.findByPhone(phone);
      const purpose = existingUser ? 'login' : 'registration';

      const result = await sendOTP(phone, purpose);

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      // In dev mode, return OTP for testing
      const response = {
        success: true,
        message: result.message,
        isNewUser: !existingUser
      };

      if (process.env.NODE_ENV === 'development' && result.devOtp) {
        response.devOtp = result.devOtp;
      }

      res.json(response);
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  }
);

/**
 * POST /api/auth/verify-otp
 * Verify OTP and login/register
 */
router.post('/verify-otp',
  phoneValidation,
  otpValidation,
  handleValidation,
  async (req, res) => {
    try {
      const { phone, otp, name } = req.body;

      // Verify OTP
      const verification = await verifyOTP(phone, otp);

      if (!verification.valid) {
        return res.status(400).json({ error: verification.error });
      }

      // Check if user exists
      let user = await User.findByPhone(phone);

      if (!user) {
        // New user registration
        if (!name) {
          return res.status(400).json({ error: 'Name is required for registration' });
        }

        user = new User({
          name,
          phone,
          isVerified: true
        });
        await user.save();
      } else {
        // Existing user login
        user.lastLogin = new Date();
        await user.save();
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.getPhone(),
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  }
);

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
      role: req.user.role
    });
  } catch (error) {
    console.error('Get user error:', error);
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
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

module.exports = router;
