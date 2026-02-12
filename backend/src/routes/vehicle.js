const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const QRCode = require('../models/QRCode');
const { authenticate } = require('../middleware/auth');
const {
  handleValidation,
  vehicleNumberValidation,
  pinValidation,
  vehicleTypeValidation
} = require('../middleware/validators');
const { body, param } = require('express-validator');

/**
 * POST /api/vehicle/register
 * Register a new vehicle with QR code
 */
router.post('/register',
  authenticate,
  vehicleNumberValidation,
  body('qrId').trim().notEmpty().withMessage('QR code ID is required'),
  pinValidation,
  vehicleTypeValidation,
  handleValidation,
  async (req, res) => {
    try {
      const { vehicleNumber, qrId, activationPin, vehicleType, vehicleColor } = req.body;

      // Check if QR code exists and is available
      const qrCode = await QRCode.getAvailable(qrId);
      if (!qrCode) {
        return res.status(400).json({
          error: 'QR code not found or already activated'
        });
      }

      // Verify activation PIN
      try {
        await qrCode.activate(req.user._id, activationPin);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }

      // Check if vehicle number already registered
      const existingVehicle = await Vehicle.findOne({
        vehicleNumber,
        isActive: true
      });

      if (existingVehicle) {
        return res.status(400).json({
          error: 'Vehicle number already registered'
        });
      }

      // Create vehicle
      const vehicle = new Vehicle({
        vehicleNumber,
        qrCodeId: qrId,
        user: req.user._id,
        vehicleType: vehicleType || 'car',
        vehicleColor
      });

      await vehicle.save();

      res.status(201).json({
        success: true,
        vehicle: {
          id: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          qrCodeId: vehicle.qrCodeId,
          vehicleType: vehicle.vehicleType,
          isActive: vehicle.isActive
        }
      });
    } catch (error) {
      console.error('Vehicle registration error:', error);
      res.status(500).json({ error: 'Failed to register vehicle' });
    }
  }
);

/**
 * GET /api/vehicle/my-vehicles
 * Get all vehicles of current user
 */
router.get('/my-vehicles', authenticate, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      user: req.user._id,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      vehicles: vehicles.map(v => ({
        id: v._id,
        vehicleNumber: v.vehicleNumber,
        qrCodeId: v.qrCodeId,
        vehicleType: v.vehicleType,
        vehicleColor: v.vehicleColor,
        totalScans: v.totalScans,
        lastScannedAt: v.lastScannedAt,
        createdAt: v.createdAt
      }))
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to get vehicles' });
  }
});

/**
 * GET /api/vehicle/:id
 * Get vehicle details
 */
router.get('/:id',
  authenticate,
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  handleValidation,
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        user: req.user._id
      });

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      res.json({
        id: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        qrCodeId: vehicle.qrCodeId,
        vehicleType: vehicle.vehicleType,
        vehicleColor: vehicle.vehicleColor,
        isActive: vehicle.isActive,
        totalScans: vehicle.totalScans,
        lastScannedAt: vehicle.lastScannedAt,
        createdAt: vehicle.createdAt
      });
    } catch (error) {
      console.error('Get vehicle error:', error);
      res.status(500).json({ error: 'Failed to get vehicle' });
    }
  }
);

/**
 * PUT /api/vehicle/:id
 * Update vehicle details
 */
router.put('/:id',
  authenticate,
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  vehicleTypeValidation,
  body('vehicleColor').optional().trim().isLength({ max: 50 }),
  handleValidation,
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        user: req.user._id
      });

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      const { vehicleType, vehicleColor } = req.body;

      if (vehicleType) vehicle.vehicleType = vehicleType;
      if (vehicleColor !== undefined) vehicle.vehicleColor = vehicleColor;

      await vehicle.save();

      res.json({
        success: true,
        vehicle: {
          id: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          vehicleType: vehicle.vehicleType,
          vehicleColor: vehicle.vehicleColor
        }
      });
    } catch (error) {
      console.error('Update vehicle error:', error);
      res.status(500).json({ error: 'Failed to update vehicle' });
    }
  }
);

/**
 * DELETE /api/vehicle/:id
 * Deactivate vehicle (soft delete)
 */
router.delete('/:id',
  authenticate,
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  handleValidation,
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        user: req.user._id,
        isActive: true
      });

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      vehicle.isActive = false;
      vehicle.deactivatedAt = new Date();
      await vehicle.save();

      // Also disable the QR code
      await QRCode.updateOne(
        { qrId: vehicle.qrCodeId },
        { status: 'disabled' }
      );

      res.json({
        success: true,
        message: 'Vehicle deactivated'
      });
    } catch (error) {
      console.error('Delete vehicle error:', error);
      res.status(500).json({ error: 'Failed to deactivate vehicle' });
    }
  }
);

module.exports = router;
