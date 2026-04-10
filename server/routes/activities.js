const express  = require('express');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET activities
router.get('/', async (req, res) => {
  const { limit = 50, type } = req.query;
  const pageLimit = Math.min(200, Math.max(1, parseInt(limit)));

  const query = { user: req.user.id };
  if (type) query.type = type;

  const activities = await Activity.find(query).sort({ createdAt: -1 }).limit(pageLimit);
  res.json({ success: true, count: activities.length, data: activities });
});

// DELETE clear all
router.delete('/clear', async (req, res) => {
  await Activity.deleteMany({ user: req.user.id });
  res.json({ success: true, message: 'Activity log cleared' });
});

module.exports = router;