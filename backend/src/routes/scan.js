const express = require('express');
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

/**
 * GET /api/scan/:qrId
 * Get vehicle info by QR code (public endpoint)
 */
router.get('/:qrId',
  qrIdValidation,
  handleValidation,
  async (req, res) => {
    try {
      const { qrId } = req.params;

      // Find active vehicle
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

      // Update vehicle scan count
      await vehicle.recordScan();

      // Return vehicle info (without exposing phone number)
      res.json({
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        vehicleColor: vehicle.vehicleColor,
        ownerName: vehicle.user?.name || 'Vehicle Owner',
        // Phone number is NOT returned here for privacy
        canCall: true,
        canAlert: true
      });
    } catch (error) {
      console.error('Scan error:', error);
      res.status(500).json({ error: 'Failed to process scan' });
    }
  }
);

/**
 * POST /api/scan/:qrId/call
 * Initiate call to vehicle owner (returns masked number or triggers call)
 */
router.post('/:qrId/call',
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

      // Get owner's phone number
      const ownerPhone = vehicle.user.getPhone();

      // TODO: In production, implement call masking
      // For now, return the phone number for direct call
      // Later: Use Twilio/Exotel for call masking

      res.json({
        success: true,
        // For MVP: Return phone number with tel: link
        // For production: Return masked number or trigger callback
        phone: `+91${ownerPhone}`,
        callMethod: 'direct' // or 'masked' in production
      });
    } catch (error) {
      console.error('Call error:', error);
      res.status(500).json({ error: 'Failed to initiate call' });
    }
  }
);

/**
 * POST /api/scan/:qrId/alert
 * Send alert to vehicle owner
 */
router.post('/:qrId/alert',
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

      // Create alert message based on type
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

      // TODO: Send actual notification
      // - Push notification (if app exists)
      // - SMS notification
      // - WhatsApp notification
      console.log(`[ALERT] Vehicle ${vehicle.vehicleNumber}: ${alertContent}`);

      res.json({
        success: true,
        message: 'Alert sent to vehicle owner'
      });
    } catch (error) {
      console.error('Alert error:', error);
      res.status(500).json({ error: 'Failed to send alert' });
    }
  }
);

module.exports = router;
