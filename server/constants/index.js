// Medicine Categories
const MEDICINE_CATEGORIES = [
  'Antibiotics',
  'Analgesics',
  'Antihistamines',
  'Antacids',
  'Vitamins & Supplements',
  'Cough & Cold',
  'Anti-inflammatory',
  'Cardiovascular',
  'Diabetes',
  'Digestive',
  'Respiratory',
  'Skincare',
  'Topical',
  'Injectables',
  'Others',
];

// Medicine Schedules
const MEDICINE_SCHEDULES = ['OTC', 'Schedule H', 'Schedule H1', 'Schedule X'];

// Activity Types
const ACTIVITY_TYPES = ['add', 'edit', 'delete', 'sell', 'restock', 'alert', 'audit', 'system'];

// Stock Status
const STOCK_STATUS = {
  OUT_OF_STOCK: 'out_of_stock',
  LOW_STOCK: 'low_stock',
  OPTIMAL: 'optimal',
};

// Expiry Status
const EXPIRY_STATUS = {
  EXPIRED: 'expired',
  EXPIRING_30: 'expiring_30',
  EXPIRING_90: 'expiring_90',
  EXPIRING_180: 'expiring_180',
  OK: 'ok',
};

// Default Reorder Levels
const DEFAULT_REORDER_LEVEL = 10;

// Pagination
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

// Predictions
const PREDICTION_THRESHOLDS = {
  HIGH_DEMAND: 0.7,
  MEDIUM_DEMAND: 0.4,
  LOW_DEMAND: 0.1,
};

module.exports = {
  MEDICINE_CATEGORIES,
  MEDICINE_SCHEDULES,
  ACTIVITY_TYPES,
  STOCK_STATUS,
  EXPIRY_STATUS,
  DEFAULT_REORDER_LEVEL,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  PREDICTION_THRESHOLDS,
};
