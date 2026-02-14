const { body, param, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

// Phone number validation (Indian format)
const phoneValidation = body('phone')
  .trim()
  .matches(/^[6-9]\d{9}$/)
  .withMessage('Invalid phone number. Use 10 digit Indian mobile number');

// Name validation
const nameValidation = body('name')
  .trim()
  .isLength({ min: 2, max: 100 })
  .withMessage('Name must be between 2 and 100 characters')
  .matches(/^[a-zA-Z\s]+$/)
  .withMessage('Name can only contain letters and spaces');

// Vehicle number validation (Indian format)
const vehicleNumberValidation = body('vehicleNumber')
  .trim()
  .toUpperCase()
  .matches(/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/)
  .withMessage('Invalid vehicle number format (e.g., MH12AB1234)');

// Vehicle number param validation (for URL params)
const vehicleNumberParamValidation = param('vehicleNumber')
  .trim()
  .toUpperCase()
  .matches(/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/)
  .withMessage('Invalid vehicle number format (e.g., MH12AB1234)');

// QR ID validation
const qrIdValidation = param('qrId')
  .trim()
  .isLength({ min: 7, max: 7 })
  .withMessage('Invalid QR code')
  .matches(/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZ]{7}$/)
  .withMessage('Invalid QR code format');

// Firebase ID token validation
const firebaseTokenValidation = body('idToken')
  .isString()
  .notEmpty()
  .withMessage('Firebase ID token is required');

// OTP validation
const otpValidation = body('otp')
  .trim()
  .isLength({ exactly: 6 })
  .withMessage('OTP must be 6 digits')
  .isNumeric()
  .withMessage('OTP must contain only numbers');

// Activation PIN validation
const pinValidation = body('activationPin')
  .trim()
  .isLength({ exactly: 6 })
  .withMessage('PIN must be 6 digits')
  .isNumeric()
  .withMessage('PIN must contain only numbers');

// Alert message validation
const alertMessageValidation = body('message')
  .optional()
  .trim()
  .isLength({ max: 500 })
  .withMessage('Message must be under 500 characters');

// Vehicle type validation
const vehicleTypeValidation = body('vehicleType')
  .optional()
  .isIn(['car', 'bike', 'truck', 'auto', 'other'])
  .withMessage('Invalid vehicle type');

module.exports = {
  handleValidation,
  phoneValidation,
  nameValidation,
  vehicleNumberValidation,
  vehicleNumberParamValidation,
  qrIdValidation,
  otpValidation,
  firebaseTokenValidation,
  pinValidation,
  alertMessageValidation,
  vehicleTypeValidation
};
