const express  = require('express');
const Medicine = require('../models/Medicine');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');
const { isValidQuantity, isValidPrice, isValidExpiryDate } = require('../utils/validators');
const { sanitizeString, sanitizeNumber } = require('../utils/sanitizers');
const { MEDICINE_CATEGORIES, MEDICINE_SCHEDULES } = require('../constants');

const router = express.Router();
router.use(protect);

const log = (userId, type, message, icon, color, meta = {}) =>
  Activity.create({ user: userId, type, message, icon, color, meta });

// GET all medicines
router.get('/', async (req, res) => {
  const { category, schedule, search, stockStatus, expiryFilter, page = 1, limit = 20, sortBy = 'name' } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const pageLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * pageLimit;

  const query = { user: req.user.id, isActive: true };
  if (category && category !== 'All' && MEDICINE_CATEGORIES.includes(category)) query.category = category;
  if (schedule && schedule !== 'All' && MEDICINE_SCHEDULES.includes(schedule)) query.schedule = schedule;
  if (search) {
    const rx = { $regex: sanitizeString(search), $options: 'i' };
    query.$or = [{ name: rx }, { genericName: rx }, { batchNumber: rx }, { manufacturer: rx }];
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (stockStatus === 'out') query.stockQty = 0;
  if (stockStatus === 'low') { query.$expr = { $lte: ['$stockQty', '$reorderLevel'] }; query.stockQty = { $gt: 0 }; }
  if (expiryFilter === 'expired') query.expiryDate = { $lt: today };
  if (expiryFilter === '30') query.expiryDate = { $gte: today, $lte: new Date(today.getTime() + 30 * 86400000) };
  if (expiryFilter === '90') query.expiryDate = { $gte: today, $lte: new Date(today.getTime() + 90 * 86400000) };

  const sortMap = { expiry: { expiryDate: 1 }, stock: { stockQty: -1 }, price: { mrp: -1 } };
  const sort = sortMap[sortBy] || { name: 1 };

  const [medicines, total] = await Promise.all([
    Medicine.find(query).sort(sort).skip(skip).limit(pageLimit),
    Medicine.countDocuments(query),
  ]);

  res.json({ success: true, count: medicines.length, total, page: pageNum, pages: Math.ceil(total / pageLimit), data: medicines });
});

// GET dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in30  = new Date(today.getTime() + 30 * 86400000);
  const in90  = new Date(today.getTime() + 90 * 86400000);
  const all   = await Medicine.find({ user: req.user.id, isActive: true });

  res.json({
    success: true,
    data: {
      totalMedicines:       all.length,
      totalInventoryValue:  Math.round(all.reduce((s, m) => s + m.purchasePrice * m.stockQty, 0)),
      totalRetailValue:     Math.round(all.reduce((s, m) => s + m.mrp * m.stockQty, 0)),
      grossProfitPotential: Math.round(all.reduce((s, m) => s + (m.sellingPrice - m.purchasePrice) * m.stockQty, 0)),
      outOfStock:           all.filter(m => m.stockQty === 0).length,
      lowStock:             all.filter(m => m.stockQty > 0 && m.stockQty <= m.reorderLevel).length,
      expiringIn30Days:     all.filter(m => m.expiryDate >= today && m.expiryDate <= in30).length,
      expiringIn90Days:     all.filter(m => m.expiryDate >= today && m.expiryDate <= in90).length,
      expired:              all.filter(m => m.expiryDate < today).length,
      criticalAlerts:       all.filter(m => m.expiryDate < today || m.stockQty === 0).length,
    },
  });
});

// GET single medicine
router.get('/:id', async (req, res) => {
  const medicine = await Medicine.findOne({ _id: req.params.id, user: req.user.id });
  if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
  res.json({ success: true, data: medicine });
});

// POST create
router.post('/', async (req, res) => {
  const { name, genericName, manufacturer, category, schedule, batchNumber, expiryDate, mrp, purchasePrice, sellingPrice, stockQty, reorderLevel } = req.body;
  const errors = {};

  if (!name)                                          errors.name          = 'Required';
  if (!genericName)                                   errors.genericName   = 'Required';
  if (!manufacturer)                                  errors.manufacturer  = 'Required';
  if (!category)                                      errors.category      = 'Required';
  if (!batchNumber)                                   errors.batchNumber   = 'Required';
  if (!expiryDate || !isValidExpiryDate(expiryDate))  errors.expiryDate    = 'Valid future date required';
  if (!isValidPrice(mrp))                             errors.mrp           = 'Valid price required';
  if (!isValidPrice(purchasePrice))                   errors.purchasePrice = 'Valid price required';
  if (!isValidPrice(sellingPrice))                    errors.sellingPrice  = 'Valid price required';
  if (!isValidQuantity(stockQty))                     errors.stockQty      = 'Valid quantity required';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  const medicine = await Medicine.create({
    user: req.user.id,
    name: sanitizeString(name), genericName: sanitizeString(genericName),
    manufacturer: sanitizeString(manufacturer), category,
    schedule: schedule || 'OTC', batchNumber: sanitizeString(batchNumber),
    expiryDate: new Date(expiryDate),
    mrp: sanitizeNumber(mrp), purchasePrice: sanitizeNumber(purchasePrice),
    sellingPrice: sanitizeNumber(sellingPrice), stockQty: sanitizeNumber(stockQty),
    reorderLevel: reorderLevel ? sanitizeNumber(reorderLevel) : 10,
  });

  await log(req.user.id, 'add', `Added "${medicine.name}" (Batch: ${medicine.batchNumber})`, '➕', '#10b981', { medicineId: medicine._id });

  res.status(201).json({ success: true, message: 'Medicine added', data: medicine });
});

// PUT update
router.put('/:id', async (req, res) => {
  const existing = await Medicine.findOne({ _id: req.params.id, user: req.user.id });
  if (!existing) return res.status(404).json({ success: false, message: 'Medicine not found' });

  const ALLOWED = ['name', 'genericName', 'manufacturer', 'supplier', 'category', 'schedule', 'expiryDate', 'mrp', 'purchasePrice', 'sellingPrice', 'stockQty', 'reorderLevel', 'storageCondition', 'requiresPrescription'];
  const updates = {};

  ALLOWED.forEach(f => {
    if (req.body[f] === undefined) return;
    if (f === 'expiryDate' && isValidExpiryDate(req.body[f]))                updates[f] = new Date(req.body[f]);
    else if (['mrp','purchasePrice','sellingPrice'].includes(f) && isValidPrice(req.body[f]))   updates[f] = sanitizeNumber(req.body[f]);
    else if (['stockQty','reorderLevel'].includes(f) && isValidQuantity(req.body[f]))           updates[f] = sanitizeNumber(req.body[f]);
    else if (f !== 'expiryDate')                                             updates[f] = req.body[f];
  });

  const oldQty  = existing.stockQty;
  const updated = await Medicine.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  const isRestock = req.body.stockQty !== undefined && Number(req.body.stockQty) > oldQty;

  await log(req.user.id, isRestock ? 'restock' : 'edit',
    isRestock ? `Restocked "${updated.name}" +${Number(req.body.stockQty) - oldQty}` : `Updated "${updated.name}"`,
    isRestock ? '📦' : '✏️', isRestock ? '#3b82f6' : '#f59e0b');

  res.json({ success: true, message: 'Medicine updated', data: updated });
});

// DELETE (soft)
router.delete('/:id', async (req, res) => {
  const medicine = await Medicine.findOne({ _id: req.params.id, user: req.user.id });
  if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });

  await Medicine.findByIdAndUpdate(req.params.id, { isActive: false });
  await log(req.user.id, 'delete', `Removed "${medicine.name}"`, '🗑️', '#ef4444', { medicineId: medicine._id });

  res.json({ success: true, message: 'Medicine removed' });
});

module.exports = router;