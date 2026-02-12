/**
 * OTP Service - Mock implementation for development
 * Replace with actual SMS provider (MSG91, Twilio, etc.) in production
 */

const OTP = require('../models/OTP');

/**
 * Send OTP to phone number
 * @param {string} phone - Phone number
 * @param {string} purpose - 'registration', 'login', or 'reset'
 * @returns {Promise<boolean>} - Success status
 */
async function sendOTP(phone, purpose = 'login') {
  try {
    const otp = await OTP.generate(phone, purpose);

    if (process.env.OTP_SERVICE === 'mock') {
      // Development: Log OTP to console
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
      return { success: true, message: 'OTP sent (dev mode)', devOtp: otp };
    }

    // Production: Send via SMS provider
    // TODO: Integrate with MSG91, Twilio, or similar
    // await sendSMS(phone, `Your TagSphere OTP is: ${otp}`);

    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, message: 'Failed to send OTP' };
  }
}

/**
 * Verify OTP
 * @param {string} phone - Phone number
 * @param {string} otp - OTP to verify
 * @param {string} purpose - Purpose of OTP
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function verifyOTP(phone, otp, purpose = 'login') {
  try {
    const otpDoc = await OTP.findOne({
      phone,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return { valid: false, error: 'OTP not found or expired' };
    }

    const result = otpDoc.verify(otp);
    await otpDoc.save();

    return result;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { valid: false, error: 'Verification failed' };
  }
}

module.exports = {
  sendOTP,
  verifyOTP
};
