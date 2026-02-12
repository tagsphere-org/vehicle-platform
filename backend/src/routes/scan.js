const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const ScanLog = require('../models/ScanLog');
const User = require('../models/User');
const {
  handleValidation,
  qrIdValidation,
  alertMessageValidation
} = require('../middleware/validators');
const { body } = require('express-validator');

// Per-endpoint rate limiters
const scanLimiter = rateLimit({
  windowMs: 60000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many scan requests, try again later.' }
});

const callLimiter = rateLimit({
  windowMs: 60000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many call requests, try again later.' }
});

const alertLimiter = rateLimit({
  windowMs: 60000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many alert requests, try again later.' }
});

/**
 * GET /api/scan/:qrId
 * Get vehicle info by QR code (public endpoint)
 */
router.get('/:qrId',
  scanLimiter,
  qrIdValidation,
  handleValidation,
  async (req, res) => {
    try {
      const { qrId } = req.params;

      const vehicle = await Vehicle.findOne({
        qrCodeId: qrId,
        isActive: true
      }).populate('user', 'name');

      if (!vehicle) {
        return res.status(404).json({
          error: 'Vehicle not found or QR code not activated'
        });
      }

      // Record scan
      await ScanLog.create({
        qrCodeId: qrId,
        vehicle: vehicle._id,
        action: 'view',
        scannerIp: req.ip,
        userAgent: req.get('user-agent')
      });

      await vehicle.recordScan();

      // Return vehicle info (phone number NOT returned)
      res.json({
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        vehicleColor: vehicle.vehicleColor,
        ownerName: vehicle.user?.name || 'Vehicle Owner',
        canCall: true,
        canAlert: true
      });
    } catch (error) {
      console.error('Scan error:', error.message);
      res.status(500).json({ error: 'Failed to process scan' });
    }
  }
);

/**
 * POST /api/scan/:qrId/call
 * Initiate call to vehicle owner — returns MASKED phone number
 */
router.post('/:qrId/call',
  callLimiter,
  qrIdValidation,
  handleValidation,
  async (req, res) => {
    try {
      const { qrId } = req.params;

      const vehicle = await Vehicle.findOne({
        qrCodeId: qrId,
        isActive: true
      }).populate('user');

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Log call action
      await ScanLog.create({
        qrCodeId: qrId,
        vehicle: vehicle._id,
        action: 'call',
        scannerIp: req.ip,
        userAgent: req.get('user-agent')
      });

      // Get owner's phone number — return MASKED for privacy
      const ownerPhone = vehicle.user.getPhone();
      const masked = ownerPhone.slice(0, 2) + '****' + ownerPhone.slice(-2);

      // TODO: In production, use Twilio/Exotel for call masking
      // For MVP: return full number via tel: link
      // For production: return masked number and trigger server-side callback
      res.json({
        success: true,
        phone: `+91${ownerPhone}`,
        maskedPhone: `+91${masked}`,
        callMethod: 'direct'
      });
    } catch (error) {
      console.error('Call error:', error.message);
      res.status(500).json({ error: 'Failed to initiate call' });
    }
  }
);

/**
 * POST /api/scan/:qrId/alert
 * Send alert to vehicle owner
 */
router.post('/:qrId/alert',
  alertLimiter,
  qrIdValidation,
  alertMessageValidation,
  body('alertType')
    .optional()
    .isIn(['parked_wrong', 'lights_on', 'emergency', 'other'])
    .withMessage('Invalid alert type'),
  handleValidation,
  async (req, res) => {
    try {
      const { qrId } = req.params;
      const { message, alertType = 'other' } = req.body;

      const vehicle = await Vehicle.findOne({
        qrCodeId: qrId,
        isActive: true
      }).populate('user');

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      const alertMessages = {
        parked_wrong: 'Someone reported your vehicle is parked incorrectly',
        lights_on: 'Someone noticed your vehicle lights are on',
        emergency: 'Emergency alert for your vehicle',
        other: message || 'Someone wants to contact you about your vehicle'
      };

      const alertContent = alertMessages[alertType];

      // Log alert action
      await ScanLog.create({
        qrCodeId: qrId,
        vehicle: vehicle._id,
        action: 'alert',
        alertMessage: alertContent,
        scannerIp: req.ip,
        userAgent: req.get('user-agent')
      });

      // TODO: Send actual notification (push/SMS/WhatsApp)

      res.json({
        success: true,
        message: 'Alert sent to vehicle owner'
      });
    } catch (error) {
      console.error('Alert error:', error.message);
      res.status(500).json({ error: 'Failed to send alert' });
    }
  }
);

module.exports = router;
