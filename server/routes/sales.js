const express  = require('express');
const Sale     = require('../models/Sale');
const Medicine = require('../models/Medicine');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');
const { isValidQuantity } = require('../utils/validators');
const { sanitizeString, sanitizeNumber } = require('../utils/sanitizers');

const router = express.Router();
router.use(protect);
router.use(apiLimiter);

// GET all sales
router.get('/', async (req, res) => {
  try {
    const { limit = 100, page = 1, startDate, endDate } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const pageLimit = Math.min(500, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * pageLimit;

    let query = { user: req.user.id };

    if (startDate && endDate) {
      query.soldAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .sort({ soldAt: -1 })
        .skip(skip)
        .limit(pageLimit),
      Sale.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: sales.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / pageLimit),
      data: sales
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sales' });
  }
});

// GET detailed sales stats
router.get('/analytics/detailed', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - today.getDay());

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const yearStart = new Date(today.getFullYear(), 0, 1);

    // Get sales data for various time periods
    const [todaySales, yesterdaySales, weekSales, monthSales, yearSales, allSales] = await Promise.all([
      Sale.find({ user: userId, soldAt: { $gte: today } }),
      Sale.find({ user: userId, soldAt: { $gte: yesterday, $lt: today } }),
      Sale.find({ user: userId, soldAt: { $gte: weekStart } }),
      Sale.find({ user: userId, soldAt: { $gte: monthStart } }),
      Sale.find({ user: userId, soldAt: { $gte: yearStart } }),
      Sale.find({ user: userId })
    ]);

    const calculateStats = (sales) => ({
      revenue: Math.round(sales.reduce((sum, s) => sum + s.revenue, 0)),
      profit: Math.round(sales.reduce((sum, s) => sum + s.profit, 0)),
      count: sales.length,
      avgOrderValue: sales.length > 0 ? Math.round(sales.reduce((sum, s) => sum + s.revenue, 0) / sales.length) : 0,
      totalQty: sales.reduce((sum, s) => sum + s.qty, 0),
    });

    const todayStats = calculateStats(todaySales);
    const yesterdayStats = calculateStats(yesterdaySales);
    const weekStats = calculateStats(weekSales);
    const monthStats = calculateStats(monthSales);
    const yearStats = calculateStats(yearSales);
    const allStats = calculateStats(allSales);

    const profitMargin = allStats.revenue > 0
      ? ((allStats.profit / allStats.revenue) * 100).toFixed(2)
      : 0;

    // Top medicines by revenue
    const medicineStats = {};
    allSales.forEach(sale => {
      if (!medicineStats[sale.medicineName]) {
        medicineStats[sale.medicineName] = {
          name: sale.medicineName,
          category: sale.category,
          revenue: 0,
          profit: 0,
          quantity: 0,
          transactions: 0
        };
      }
      medicineStats[sale.medicineName].revenue += sale.revenue;
      medicineStats[sale.medicineName].profit += sale.profit;
      medicineStats[sale.medicineName].quantity += sale.qty;
      medicineStats[sale.medicineName].transactions += 1;
    });

    const topMedicines = Object.values(medicineStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        today: todayStats,
        yesterday: yesterdayStats,
        week: weekStats,
        month: monthStats,
        year: yearStats,
        all: allStats,
        profitMargin,
        topMedicines,
        comparison: {
          todayVsYesterday: {
            revenue: todayStats.revenue - yesterdayStats.revenue,
            profit: todayStats.profit - yesterdayStats.profit,
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
  }
});

// GET sales summary (basic)
router.get('/stats/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todaySales, monthSales, totalCount] = await Promise.all([
      Sale.find({ user: req.user.id, soldAt: { $gte: today, $lt: tomorrow } }),
      Sale.find({ user: req.user.id, soldAt: { $gte: monthStart } }),
      Sale.countDocuments({ user: req.user.id })
    ]);

    res.json({
      success: true,
      data: {
        todayRevenue: Math.round(todaySales.reduce((s, x) => s + x.revenue, 0)),
        todayProfit: Math.round(todaySales.reduce((s, x) => s + x.profit, 0)),
        todaySalesCount: todaySales.length,
        monthRevenue: Math.round(monthSales.reduce((s, x) => s + x.revenue, 0)),
        monthProfit: Math.round(monthSales.reduce((s, x) => s + x.profit, 0)),
        monthSalesCount: monthSales.length,
        totalSalesCount: totalCount,
        expectedMonthRevenue: Math.round(monthSales.reduce((s, x) => s + x.revenue, 0))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sales summary' });
  }
});

// POST record a sale
router.post('/', async (req, res) => {
  try {
    const { medicineId, qty, patientName = '', notes = '' } = req.body;

    // Validation
    if (!medicineId) {
      return res.status(400).json({ success: false, message: 'Medicine ID required' });
    }

    if (!isValidQuantity(qty)) {
      return res.status(400).json({ success: false, message: 'Valid quantity required' });
    }

    const medicine = await Medicine.findOne({
      _id: medicineId,
      user: req.user.id
    });

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    if (medicine.stockQty < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${medicine.stockQty} units`
      });
    }

    const revenue = medicine.sellingPrice * qty;
    const profit = (medicine.sellingPrice - medicine.purchasePrice) * qty;
    const gstAmount = revenue * medicine.gstRate / 100;

    // Deduct stock
    await Medicine.findByIdAndUpdate(medicineId, { $inc: { stockQty: -qty } });

    // Create sale record
    const sale = await Sale.create({
      user: req.user.id,
      medicine: medicineId,
      medicineName: medicine.name,
      genericName: medicine.genericName,
      category: medicine.category,
      batchNumber: medicine.batchNumber,
      qty: sanitizeNumber(qty),
      sellingPrice: medicine.sellingPrice,
      purchasePrice: medicine.purchasePrice,
      revenue,
      profit,
      gstAmount: Math.round(gstAmount),
      gstRate: medicine.gstRate,
      patientName: sanitizeString(patientName),
      notes: sanitizeString(notes),
      soldAt: new Date()
    });

    // Log activity
    await Activity.create({
      user: req.user.id,
      type: 'sell',
      message: `Sold ${qty}× "${medicine.name}" ${patientName ? `to ${patientName}` : ''} — ₹${Math.round(revenue)}`,
      icon: '💰',
      color: '#f59e0b',
      meta: { medicineId, saleId: sale._id, revenue, profit }
    });

    // Low stock check
    const updated = await Medicine.findById(medicineId);
    if (updated.stockQty <= updated.reorderLevel && updated.stockQty > 0) {
      await Activity.create({
        user: req.user.id,
        type: 'alert',
        message: `⚠️ Low stock: "${medicine.name}" — ${updated.stockQty} units remaining`,
        icon: '⚠️',
        color: '#ef4444',
        meta: { medicineId }
      });
    } else if (updated.stockQty === 0) {
      await Activity.create({
        user: req.user.id,
        type: 'alert',
        message: `🔴 Out of stock: "${medicine.name}"`,
        icon: '🔴',
        color: '#dc2626',
        meta: { medicineId }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully',
      data: sale
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record sale', error: error.message });
  }
});

// PUT cancel/modify sale (within 24 hours)
router.put('/:id/cancel', async (req, res) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    // Check if sale is within 24 hours
    const hoursDiff = (new Date() - sale.soldAt) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel sales within 24 hours'
      });
    }

    // Restore stock
    await Medicine.findByIdAndUpdate(sale.medicine, {
      $inc: { stockQty: sale.qty }
    });

    // Log reversal
    await Activity.create({
      user: req.user.id,
      type: 'edit',
      message: `Cancelled sale: ${sale.qty}× "${sale.medicineName}" (returned ₹${Math.round(sale.revenue)})`,
      icon: '↩️',
      color: '#6366f1',
      meta: { saleId: sale._id }
    });

    await Sale.findByIdAndUpdate(req.params.id, { cancelled: true, cancelledAt: new Date() });

    res.json({
      success: true,
      message: 'Sale cancelled and stock restored'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel sale' });
  }
});

module.exports = router;