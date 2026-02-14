const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const ScanLog = require('../models/ScanLog');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const features = require('../config/features');
const {
  handleValidation,
  qrIdValidation,
  vehicleNumberParamValidation,
  alertMessageValidation
} = require('../middleware/validators');
const { body } = require('express-validator');
const { sendPush } = require('../utils/pushNotification');

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
 * GET /api/scan/vehicle/:vehicleNumber
 * Get vehicle info by vehicle number (public endpoint)
 */
router.get('/vehicle/:vehicleNumber',
  scanLimiter,
  vehicleNumberParamValidation,
  handleValidation,
  async (req, res) => {
    try {
      const vehicleNumber = req.params.vehicleNumber.toUpperCase();

      const vehicle = await Vehicle.findOne({
        vehicleNumber,
        isActive: true
      }).populate('user', 'name');

      if (!vehicle) {
        return res.status(404).json({
          error: 'Vehicle not found or not registered'
        });
      }

      // Record scan with number lookup source
      await ScanLog.create({
        qrCodeId: vehicle.qrCodeId,
        vehicle: vehicle._id,
        action: 'view',
        lookupSource: 'number',
        scannerIp: req.ip,
        userAgent: req.get('user-agent')
      });

      await vehicle.recordScan();

      // Check owner's subscription for call access
      const subscription = await Subscription.findOne({ user: vehicle.user._id });
      const canCall = features.calls && subscription?.plan === 'premium' &&
        subscription?.status === 'active' && subscription?.currentPeriodEnd > new Date();

      // Check if owner has emergency contact
      const owner = await User.findById(vehicle.user._id);
      const hasEmergencyContact = !!(owner?.emergencyContact?.phoneHash);

      // Create notification + push if owner has basic or premium plan
      if (subscription && subscription.plan !== 'free' && subscription.status === 'active' &&
        subscription.currentPeriodEnd > new Date()) {
        await Notification.create({
          user: vehicle.user._id,
          type: 'scan',
          title: 'Vehicle Number Lookup',
          message: `Someone looked up your vehicle ${vehicle.vehicleNumber}`,
          vehicleNumber: vehicle.vehicleNumber,
          qrCodeId: vehicle.qrCodeId
        });

        sendPush(owner, {
          title: 'Vehicle Number Lookup',
          body: `Someone looked up your vehicle ${vehicle.vehicleNumber}`,
          data: { type: 'scan', vehicleNumber: vehicle.vehicleNumber }
        });
      }

      res.json({
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        vehicleColor: vehicle.vehicleColor,
        ownerName: vehicle.user?.name || 'Vehicle Owner',
        qrCodeId: vehicle.qrCodeId,
        canCall,
        callsEnabled: features.calls,
        canAlert: true,
        hasEmergencyContact
      });
    } catch (error) {
      console.error('Vehicle number lookup error:', error.message);
      res.status(500).json({ error: 'Failed to process lookup' });
    }
  }
);

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

      // Check owner's subscription for call access
      const subscription = await Subscription.findOne({ user: vehicle.user._id });
      const canCall = features.calls && subscription?.plan === 'premium' &&
        subscription?.status === 'active' && subscription?.currentPeriodEnd > new Date();

      // Check if owner has emergency contact
      const owner = await User.findById(vehicle.user._id);

      // Create notification + push if owner has basic or premium plan
      if (subscription && subscription.plan !== 'free' && subscription.status === 'active' &&
        subscription.currentPeriodEnd > new Date()) {
        await Notification.create({
          user: vehicle.user._id,
          type: 'scan',
          title: 'QR Code Scanned',
          message: `Someone scanned your vehicle ${vehicle.vehicleNumber}`,
          vehicleNumber: vehicle.vehicleNumber,
          qrCodeId: qrId
        });

        sendPush(owner, {
          title: 'QR Code Scanned',
          body: `Someone scanned your vehicle ${vehicle.vehicleNumber}`,
          data: { type: 'scan', vehicleNumber: vehicle.vehicleNumber }
        });
      }
      const hasEmergencyContact = !!(owner?.emergencyContact?.phoneHash);

      // Return vehicle info (phone number NOT returned)
      res.json({
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        vehicleColor: vehicle.vehicleColor,
        ownerName: vehicle.user?.name || 'Vehicle Owner',
        qrCodeId: qrId,
        canCall,
        callsEnabled: features.calls,
        canAlert: true,
        hasEmergencyContact
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
    // Feature gate
    if (!features.calls) {
      return res.status(503).json({ error: 'Direct calls are not enabled yet', callsEnabled: false });
    }

    try {
      const { qrId } = req.params;

      const vehicle = await Vehicle.findOne({
        qrCodeId: qrId,
        isActive: true
      }).populate('user');

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Check owner's subscription for call access
      const subscription = await Subscription.findOne({ user: vehicle.user._id });
      const hasPremium = subscription?.plan === 'premium' && subscription?.status === 'active' &&
        subscription?.currentPeriodEnd > new Date();

      if (!hasPremium) {
        return res.status(403).json({
          success: false,
          error: 'Call not available for this vehicle',
          canAlert: true
        });
      }

      // Log call action
      await ScanLog.create({
        qrCodeId: qrId,
        vehicle: vehicle._id,
        action: 'call',
        scannerIp: req.ip,
        userAgent: req.get('user-agent')
      });

      // Create call notification for owner
      await Notification.create({
        user: vehicle.user._id,
        type: 'call',
        title: 'Call Initiated',
        message: `Someone is calling you about vehicle ${vehicle.vehicleNumber}`,
        vehicleNumber: vehicle.vehicleNumber,
        qrCodeId: qrId
      });

      sendPush(vehicle.user, {
        title: 'Incoming Call',
        body: `Someone is calling about vehicle ${vehicle.vehicleNumber}`,
        data: { type: 'call', vehicleNumber: vehicle.vehicleNumber }
      });

      // Get owner's phone number — masked for privacy
      const ownerPhone = vehicle.user.getPhone();
      const masked = ownerPhone.slice(0, 2) + '****' + ownerPhone.slice(-2);

      // TODO: In production, use Twilio/Exotel for call masking
      // For now: return tel: link for direct call
      res.json({
        success: true,
        phone: `tel:+91${ownerPhone}`,
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

      // Create notification for owner (all plans, including free)
      await Notification.create({
        user: vehicle.user._id,
        type: 'alert',
        title: 'Vehicle Alert',
        message: alertContent,
        vehicleNumber: vehicle.vehicleNumber,
        qrCodeId: qrId
      });

      // Send push notification (all plans)
      sendPush(vehicle.user, {
        title: 'Vehicle Alert',
        body: alertContent,
        data: { type: 'alert', vehicleNumber: vehicle.vehicleNumber }
      });

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

/**
 * POST /api/scan/:qrId/emergency-contact
 * Get emergency contact info for a vehicle (rate limited)
 */
router.post('/:qrId/emergency-contact',
  alertLimiter,
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

      const owner = vehicle.user;
      if (!owner?.emergencyContact?.phoneHash) {
        return res.status(404).json({ error: 'No emergency contact set for this vehicle' });
      }

      // Log emergency contact request
      await ScanLog.create({
        qrCodeId: qrId,
        vehicle: vehicle._id,
        action: 'emergency_contact_request',
        scannerIp: req.ip,
        userAgent: req.get('user-agent')
      });

      // Notify owner
      await Notification.create({
        user: owner._id,
        type: 'alert',
        title: 'Emergency Contact Requested',
        message: `Someone requested emergency contact info for vehicle ${vehicle.vehicleNumber}`,
        vehicleNumber: vehicle.vehicleNumber,
        qrCodeId: qrId
      });

      sendPush(owner, {
        title: 'Emergency Contact Requested',
        body: `Someone requested emergency contact info for vehicle ${vehicle.vehicleNumber}`,
        data: { type: 'emergency', vehicleNumber: vehicle.vehicleNumber }
      });

      // Get masked emergency phone
      const emergencyPhone = owner.getEmergencyPhone();
      const masked = emergencyPhone.slice(0, 2) + '****' + emergencyPhone.slice(-2);

      res.json({
        success: true,
        emergencyContact: {
          name: owner.emergencyContact.name,
          maskedPhone: `+91 ${masked}`,
          phone: `tel:+91${emergencyPhone}`
        }
      });
    } catch (error) {
      console.error('Emergency contact error:', error.message);
      res.status(500).json({ error: 'Failed to get emergency contact' });
    }
  }
);

module.exports = router;
