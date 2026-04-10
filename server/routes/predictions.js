const express = require('express');
const Medicine = require('../models/Medicine');
const Sale = require('../models/Sale');
const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');
const { predictDemand, calculateStockAdequacy, generateReorderRecommendations } = require('../utils/predictions');

const router = express.Router();
router.use(protect);
router.use(apiLimiter);

// GET demand predictions for a specific medicine
router.get('/medicine/:medicineId', async (req, res) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.medicineId,
      user: req.user.id
    });

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Get last 90 days of sales data
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const salesHistory = await Sale.find({
      user: req.user.id,
      medicine: req.params.medicineId,
      soldAt: { $gte: ninetyDaysAgo }
    }).sort({ soldAt: -1 });

    const demand = predictDemand(salesHistory, 30);
    const adequacy = calculateStockAdequacy(medicine.stockQty, demand.predicted);

    res.json({
      success: true,
      data: {
        medicine: {
          id: medicine._id,
          name: medicine.name,
          genericName: medicine.genericName,
          currentStock: medicine.stockQty,
          reorderLevel: medicine.reorderLevel,
        },
        prediction: demand,
        stockAdequacy: adequacy,
        recommendation: {
          shouldReorder: adequacy.status === 'critical' || adequacy.status === 'low',
          recommendedQty: Math.max(0, demand.predicted * 2 - medicine.stockQty),
          urgency: adequacy.status === 'critical' ? 'HIGH' : adequacy.status === 'low' ? 'MEDIUM' : 'LOW',
          message:
            adequacy.status === 'critical' ? 'URGENT: Reorder immediately!' :
            adequacy.status === 'low' ? 'Reorder soon' :
            adequacy.status === 'warning' ? 'Monitor stock levels' :
            'Stock adequate'
        },
        historicalData: {
          last30DaysSalesCount: salesHistory.slice(0, 30).length,
          last90DaysSalesCount: salesHistory.length,
          totalUnitssSold90Days: salesHistory.reduce((sum, s) => sum + s.qty, 0),
          totalRevenueGenerated: Math.round(salesHistory.reduce((sum, s) => sum + s.revenue, 0))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate prediction', error: error.message });
  }
});

// GET all medicines reorder recommendations
router.get('/recommendations/all', async (req, res) => {
  try {
    const medicines = await Medicine.find({
      user: req.user.id,
      isActive: true
    });

    // Get sales data for all medicines
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const allSales = await Sale.find({
      user: req.user.id,
      soldAt: { $gte: ninetyDaysAgo }
    });

    // Group sales by medicine
    const salesMap = {};
    allSales.forEach(sale => {
      const medId = sale.medicine.toString();
      if (!salesMap[medId]) salesMap[medId] = [];
      salesMap[medId].push(sale);
    });

    // Generate recommendations
    const recommendations = generateReorderRecommendations(medicines, salesMap);

    // Separate by priority
    const critical = recommendations.filter(r => r.priority === 1);
    const urgent = recommendations.filter(r => r.priority === 2);
    const warning = recommendations.filter(r => r.priority === 3);
    const routine = recommendations.filter(r => r.priority === 4);

    res.json({
      success: true,
      data: {
        totalMedicines: medicines.length,
        medicinesRequiringReorder: recommendations.length,
        breakdown: {
          critical: { count: critical.length, items: critical },
          urgent: { count: urgent.length, items: urgent },
          warning: { count: warning.length, items: warning },
          routine: { count: routine.length, items: routine }
        },
        estimatedTotalReorderCost: Math.round(
          recommendations.reduce((sum, r) => sum + (r.recommendedQty * r.medicine?.purchasePrice || 0), 0)
        ),
        reorderPriority: recommendations.slice(0, 10)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate recommendations', error: error.message });
  }
});

// GET category-wise demand trends
router.get('/trends/category', async (req, res) => {
  try {
    const medicines = await Medicine.find({
      user: req.user.id,
      isActive: true
    });

    const categories = {};

    // Group medicines by category
    medicines.forEach(med => {
      if (!categories[med.category]) {
        categories[med.category] = [];
      }
      categories[med.category].push(med);
    });

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const allSales = await Sale.find({
      user: req.user.id,
      soldAt: { $gte: ninetyDaysAgo }
    });

    const categoryTrends = {};

    for (const [category, meds] of Object.entries(categories)) {
      const categoryRevenue = allSales
        .filter(s => s.category === category)
        .reduce((sum, s) => sum + s.revenue, 0);

      const categoryQty = allSales
        .filter(s => s.category === category)
        .reduce((sum, s) => sum + s.qty, 0);

      const categoryProfit = allSales
        .filter(s => s.category === category)
        .reduce((sum, s) => sum + s.profit, 0);

      categoryTrends[category] = {
        medicineCount: meds.length,
        totalRevenue: Math.round(categoryRevenue),
        totalProfit: Math.round(categoryProfit),
        unitsSold: categoryQty,
        avgSaleValue: categoryQty > 0 ? Math.round(categoryRevenue / categoryQty) : 0,
        profitMargin: categoryRevenue > 0 ? ((categoryProfit / categoryRevenue) * 100).toFixed(2) : 0
      };
    }

    // Sort by revenue
    const sorted = Object.entries(categoryTrends)
      .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
      .reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
      }, {});

    res.json({
      success: true,
      data: sorted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trends', error: error.message });
  }
});

// GET low stock medicines with predictions
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const medicines = await Medicine.find({
      user: req.user.id,
      isActive: true,
      $expr: {
        $or: [
          { $eq: ['$stockQty', 0] },
          { $lte: ['$stockQty', '$reorderLevel'] }
        ]
      }
    });

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const allSales = await Sale.find({
      user: req.user.id,
      soldAt: { $gte: ninetyDaysAgo }
    });

    const salesMap = {};
    allSales.forEach(sale => {
      const medId = sale.medicine.toString();
      if (!salesMap[medId]) salesMap[medId] = [];
      salesMap[medId].push(sale);
    });

    const alerts = medicines.map(med => {
      const salesHistory = salesMap[med._id.toString()] || [];
      const demand = predictDemand(salesHistory, 30);
      const daysToStockOut = demand.predicted > 0
        ? Math.ceil(med.stockQty / (demand.predicted / 30))
        : 999;

      return {
        medicineId: med._id,
        name: med.name,
        currentStock: med.stockQty,
        reorderLevel: med.reorderLevel,
        predictedDailyDemand: (demand.predicted / 30).toFixed(2),
        daysToStockOut,
        urgency: med.stockQty === 0 ? 'CRITICAL' : daysToStockOut < 7 ? 'URGENT' : 'HIGH',
        recommendedQty: Math.max(demand.predicted * 2 - med.stockQty, 0)
      };
    }).sort((a, b) => {
      const urgencyOrder = { CRITICAL: 0, URGENT: 1, HIGH: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch alerts', error: error.message });
  }
});

module.exports = router;
