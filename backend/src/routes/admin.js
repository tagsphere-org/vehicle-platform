const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const QRCode = require('../models/QRCode');
const ScanLog = require('../models/ScanLog');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { generateBatch } = require('../utils/generateQrId');
const { body, query } = require('express-validator');
const { handleValidation } = require('../middleware/validators');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalVehicles,
      activeVehicles,
      totalScans,
      availableQRs,
      activatedQRs
    ] = await Promise.all([
      User.countDocuments(),
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ isActive: true }),
      ScanLog.countDocuments(),
      QRCode.countDocuments({ status: 'available' }),
      QRCode.countDocuments({ status: 'activated' })
    ]);

    // Get scans from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentScans = await ScanLog.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      users: {
        total: totalUsers
      },
      vehicles: {
        total: totalVehicles,
        active: activeVehicles
      },
      qrCodes: {
        available: availableQRs,
        activated: activatedQRs,
        total: availableQRs + activatedQRs
      },
      scans: {
        total: totalScans,
        last7Days: recentScans
      }
    });
  } catch (error) {
    console.error('Stats error:', error.message);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * POST /api/admin/qr-codes/generate
 * Generate new QR codes
 */
router.post('/qr-codes/generate',
  body('count')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Count must be between 1 and 1000'),
  body('batchId')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  handleValidation,
  async (req, res) => {
    try {
      const { count, batchId } = req.body;

      // Generate QR IDs
      const batch = generateBatch(count);

      // Check for existing IDs (collision check)
      const existingIds = await QRCode.find({
        qrId: { $in: batch.map(b => b.qrId) }
      }).select('qrId');

      const existingSet = new Set(existingIds.map(e => e.qrId));
      const newBatch = batch.filter(b => !existingSet.has(b.qrId));

      if (newBatch.length < count) {
        console.warn(`${count - newBatch.length} QR IDs were duplicates`);
      }

      // Insert QR codes
      const qrCodes = await QRCode.insertMany(
        newBatch.map(b => ({
          qrId: b.qrId,
          activationPin: b.activationPin,
          batchId: batchId || `BATCH-${Date.now()}`
        }))
      );

      res.status(201).json({
        success: true,
        generated: qrCodes.length,
        batchId: qrCodes[0]?.batchId,
        qrCodes: qrCodes.map(qr => ({
          qrId: qr.qrId,
          activationPin: qr.activationPin,
          url: `https://tagsphere.co.in/v/${qr.qrId}`
        }))
      });
    } catch (error) {
      console.error('Generate QR error:', error.message);
      res.status(500).json({ error: 'Failed to generate QR codes' });
    }
  }
);

/**
 * GET /api/admin/qr-codes
 * List QR codes
 */
router.get('/qr-codes',
  query('status').optional().isIn(['available', 'activated', 'disabled']),
  query('batchId').optional().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidation,
  async (req, res) => {
    try {
      const { status, batchId, page = 1, limit = 50 } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (batchId) filter.batchId = batchId;

      const [qrCodes, total] = await Promise.all([
        QRCode.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .select('-__v')
          .lean(),
        QRCode.countDocuments(filter)
      ]);

      res.json({
        qrCodes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('List QR codes error:', error.message);
      res.status(500).json({ error: 'Failed to list QR codes' });
    }
  }
);

/**
 * GET /api/admin/users
 * List users
 */
router.get('/users',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidation,
  async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;

      const [users, total] = await Promise.all([
        User.find()
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .select('-phone -phoneHash -__v')
          .lean(),
        User.countDocuments()
      ]);

      res.json({
        users: users.map(u => ({
          id: u._id,
          name: u.name,
          isVerified: u.isVerified,
          isActive: u.isActive,
          role: u.role,
          createdAt: u.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('List users error:', error.message);
      res.status(500).json({ error: 'Failed to list users' });
    }
  }
);

/**
 * GET /api/admin/vehicles
 * List vehicles
 */
router.get('/vehicles',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('active').optional().isBoolean(),
  handleValidation,
  async (req, res) => {
    try {
      const { page = 1, limit = 50, active } = req.query;

      const filter = {};
      if (active !== undefined) {
        filter.isActive = active === 'true';
      }

      const [vehicles, total] = await Promise.all([
        Vehicle.find(filter)
          .populate('user', 'name')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .select('-__v')
          .lean(),
        Vehicle.countDocuments(filter)
      ]);

      res.json({
        vehicles: vehicles.map(v => ({
          id: v._id,
          vehicleNumber: v.vehicleNumber,
          qrCodeId: v.qrCodeId,
          vehicleType: v.vehicleType,
          ownerName: v.user?.name,
          isActive: v.isActive,
          totalScans: v.totalScans,
          createdAt: v.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('List vehicles error:', error.message);
      res.status(500).json({ error: 'Failed to list vehicles' });
    }
  }
);

/**
 * GET /api/admin/scan-logs
 * Get scan logs
 */
router.get('/scan-logs',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('qrCodeId').optional().trim(),
  handleValidation,
  async (req, res) => {
    try {
      const { page = 1, limit = 50, qrCodeId } = req.query;

      const filter = {};
      if (qrCodeId) filter.qrCodeId = qrCodeId;

      const [logs, total] = await Promise.all([
        ScanLog.find(filter)
          .populate('vehicle', 'vehicleNumber')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .select('-__v')
          .lean(),
        ScanLog.countDocuments(filter)
      ]);

      res.json({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('List scan logs error:', error.message);
      res.status(500).json({ error: 'Failed to list scan logs' });
    }
  }
);

module.exports = router;
