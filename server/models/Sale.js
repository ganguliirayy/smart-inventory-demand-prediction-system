const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicine:      { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  medicineName:  { type: String, required: true },
  genericName:   { type: String, default: '' },
  category:      { type: String, default: '' },
  batchNumber:   { type: String, default: '' },
  qty:           { type: Number, required: true, min: 1 },
  sellingPrice:  { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  revenue:       { type: Number, required: true },
  profit:        { type: Number, required: true },
  gstAmount:     { type: Number, default: 0 },
  gstRate:       { type: Number, default: 0 },
  patientName:   { type: String, default: '' },
  notes:         { type: String, default: '' },
  soldAt:        { type: Date, default: Date.now },
  cancelled:     { type: Boolean, default: false },
  cancelledAt:   { type: Date, default: null },
  cancelReason:  { type: String, default: '' },
}, { timestamps: true });

SaleSchema.index({ user: 1, soldAt: -1 });
SaleSchema.index({ user: 1, cancelled: 1 });
SaleSchema.index({ user: 1, medicine: 1, soldAt: -1 });

module.exports = mongoose.model('Sale', SaleSchema);
