const { PREDICTION_THRESHOLDS } = require('../constants');

/**
 * Calculate demand prediction based on sales history
 * Uses simple moving average and trend analysis
 */
const predictDemand = (salesHistory, daysAhead = 30) => {
  if (!salesHistory || salesHistory.length === 0) {
    return {
      predicted: 0,
      confidence: 0,
      trend: 'stable',
      level: 'low',
    };
  }

  // Calculate moving average (last 30 days)
  const avg30 = salesHistory.reduce((sum, sale) => sum + sale.qty, 0) / Math.min(30, salesHistory.length);

  // Calculate trend
  const recent = salesHistory.slice(0, Math.min(15, salesHistory.length));
  const older = salesHistory.slice(Math.min(15, salesHistory.length), Math.min(30, salesHistory.length));

  const recentAvg = recent.length > 0 ? recent.reduce((sum, sale) => sum + sale.qty, 0) / recent.length : 0;
  const olderAvg = older.length > 0 ? older.reduce((sum, sale) => sum + sale.qty, 0) / older.length : 0;

  let trend = 'stable';
  if (recentAvg > olderAvg * 1.2) trend = 'increasing';
  else if (recentAvg < olderAvg * 0.8) trend = 'decreasing';

  // Calculate predicted demand for next daysAhead
  const trendFactor = trend === 'increasing' ? 1.15 : trend === 'decreasing' ? 0.85 : 1;
  const predicted = Math.round(avg30 * (daysAhead / 30) * trendFactor);

  // Confidence score (0-1)
  const confidence = Math.min(1, salesHistory.length / 100);

  // Determine demand level
  let level = 'low';
  if (recentAvg > PREDICTION_THRESHOLDS.HIGH_DEMAND * 100) level = 'high';
  else if (recentAvg > PREDICTION_THRESHOLDS.MEDIUM_DEMAND * 100) level = 'medium';

  return {
    predicted: Math.max(1, predicted),
    confidence: parseFloat(confidence.toFixed(2)),
    trend,
    level,
    average30Day: Math.round(avg30),
    recent15DayAvg: Math.round(recentAvg),
  };
};

/**
 * Calculate stock adequacy
 */
const calculateStockAdequacy = (currentStock, predictedDemand, reorderDays = 30) => {
  const daysStockWillLast = currentStock === 0 ? 0 : Math.floor((currentStock / predictedDemand) * reorderDays);

  return {
    isAdequate: daysStockWillLast >= reorderDays,
    daysOfSupply: daysStockWillLast,
    recommendedStock: predictedDemand,
    status: 
      daysStockWillLast < 7 ? 'critical' :
      daysStockWillLast < 14 ? 'low' :
      daysStockWillLast < 30 ? 'warning' :
      'optimal',
  };
};

/**
 * Generate reorder recommendations
 */
const generateReorderRecommendations = (medicines, salesDataMap) => {
  return medicines.map(med => {
    const salesHistory = salesDataMap[med._id] || [];
    const demand = predictDemand(salesHistory);
    const adequacy = calculateStockAdequacy(med.stockQty, demand.predicted);

    return {
      medicineId: med._id,
      medicineName: med.name,
      genericName: med.genericName,
      currentStock: med.stockQty,
      predictedMonthlyDemand: demand.predicted,
      recommendedQty: Math.max(0, demand.predicted - med.stockQty),
      stockAdequacy: adequacy,
      demandLevel: demand.level,
      trend: demand.trend,
      priority: adequacy.status === 'critical' ? 1 : adequacy.status === 'low' ? 2 : adequacy.status === 'warning' ? 3 : 4,
    };
  }).filter(rec => rec.recommendedQty > 0).sort((a, b) => a.priority - b.priority);
};

module.exports = {
  predictDemand,
  calculateStockAdequacy,
  generateReorderRecommendations,
};
