const express  = require('express');
const User     = require('../models/User');
const Medicine = require('../models/Medicine');
const Sale     = require('../models/Sale');
const Activity = require('../models/Activity');
const { protect, adminOnly } = require('../middleware/auth');
const { sanitizeString } = require('../utils/sanitizers');

const router = express.Router();

// Sabhi admin routes ke liye pehle login + isAdmin check
router.use(protect, adminOnly);

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  const today      = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [totalUsers, activeUsers, totalMedicines, totalSales, todaySales, monthSales] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Medicine.countDocuments({ isActive: true }),
      Sale.countDocuments(),
      Sale.find({ soldAt: { $gte: today } }),
      Sale.find({ soldAt: { $gte: monthStart } }),
    ]);

  const rev = arr => arr.reduce((s, x) => s + x.revenue, 0);

  res.json({
    success: true,
    data: {
      users:     { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
      inventory: { totalMedicines },
      sales: {
        total:        totalSales,
        todayCount:   todaySales.length,
        todayRevenue: Math.round(rev(todaySales)),
        monthCount:   monthSales.length,
        monthRevenue: Math.round(rev(monthSales)),
      },
    },
  });
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;
  const pageNum   = Math.max(1, parseInt(page));
  const pageLimit = Math.min(100, parseInt(limit));
  const skip      = (pageNum - 1) * pageLimit;

  const query = {};
  if (search) {
    const rx = { $regex: sanitizeString(search), $options: 'i' };
    query.$or = [{ name: rx }, { email: rx }];
  }
  if (status === 'active')   query.isActive = true;
  if (status === 'inactive') query.isActive = false;

  const [users, total] = await Promise.all([
    User.find(query).select('-password -__v').sort({ createdAt: -1 }).skip(skip).limit(pageLimit),
    User.countDocuments(query),
  ]);

  res.json({ success: true, count: users.length, total, page: pageNum, pages: Math.ceil(total / pageLimit), data: users });
});

// ── GET /api/admin/users/:id ──────────────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -__v');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
});

// ── PUT /api/admin/users/:id/toggle ──────────────────────────────────────────
// User ko activate / deactivate karo
router.put('/users/:id/toggle', async (req, res) => {
  if (req.params.id === req.user.id.toString()) {
    return res.status(400).json({ success: false, message: 'Apna account deactivate nahi kar sakte' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
    data: { id: user._id, email: user.email, isActive: user.isActive },
  });
});

// ── PUT /api/admin/users/:id/role ─────────────────────────────────────────────
// Admin rights grant/revoke karo
router.put('/users/:id/role', async (req, res) => {
  const { isAdmin } = req.body;

  if (typeof isAdmin !== 'boolean') {
    return res.status(400).json({ success: false, message: 'isAdmin must be true or false' });
  }
  if (req.params.id === req.user.id.toString() && isAdmin === false) {
    return res.status(400).json({ success: false, message: 'Apni admin rights remove nahi kar sakte' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { isAdmin }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  res.json({ success: true, message: `Admin rights ${isAdmin ? 'granted' : 'revoked'}`, data: user });
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
// User + uska sara data delete karo
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id.toString()) {
    return res.status(400).json({ success: false, message: 'Apna account delete nahi kar sakte' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  await Promise.all([
    Medicine.deleteMany({ user: req.params.id }),
    Sale.deleteMany({ user: req.params.id }),
    Activity.deleteMany({ user: req.params.id }),
    User.findByIdAndDelete(req.params.id),
  ]);

  res.json({ success: true, message: 'User aur uska sara data delete ho gaya' });
});

// ── GET /api/admin/activities ─────────────────────────────────────────────────
router.get('/activities', async (req, res) => {
  const { limit = 100 } = req.query;
  const activities = await Activity.find({})
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(Math.min(500, parseInt(limit)));

  res.json({ success: true, count: activities.length, data: activities });
});

module.exports = router;