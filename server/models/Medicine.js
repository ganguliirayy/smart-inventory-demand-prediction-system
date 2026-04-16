const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  user:             { type:mongoose.Schema.Types.ObjectId, ref:'User', required:false },
  name:             { type:String, required:true, trim:true },
  genericName:      { type:String, required:true },
  manufacturer:     { type:String, required:true },
  supplier:         { type:String, default:'' },
  category:         { type:String, required:true },
  therapeuticClass: { type:String, default:'' },
  schedule:         { type:String, enum:['OTC','Schedule H','Schedule H1','Schedule X'], default:'OTC' },
  batchNumber:      { type:String, required:true },
  manufacturingDate:{ type:Date },
  expiryDate:       { type:Date, required:true },
  mrp:              { type:Number, required:true, min:0 },
  purchasePrice:    { type:Number, required:true, min:0 },
  sellingPrice:     { type:Number, required:true, min:0 },
  hsnCode:          { type:String, default:'' },
  gstRate:          { type:Number, default:12 },
  stockQty:         { type:Number, required:true, default:0, min:0 },
  reorderLevel:     { type:Number, required:true, default:0 },
  packSize:         { type:String, default:'' },
  rackLocation:     { type:String, default:'' },
  storageCondition: { type:String, default:'Room Temperature (15-30°C)' },
  description:      { type:String, default:'' },
  requiresPrescription: { type:Boolean, default:false },
  isActive:         { type:Boolean, default:true },
}, { timestamps:true });

MedicineSchema.virtual('daysToExpiry').get(function() {
  return Math.ceil((new Date(this.expiryDate) - new Date()) / 86400000);
});

MedicineSchema.set('toJSON',   { virtuals:true });
MedicineSchema.set('toObject', { virtuals:true });

MedicineSchema.index({ user:1, name:1 });
MedicineSchema.index({ user:1, expiryDate:1 });

module.exports = mongoose.model('Medicine', MedicineSchema);