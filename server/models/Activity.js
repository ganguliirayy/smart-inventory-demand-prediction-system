const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  user:    { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  type:    { type:String, enum:['add','edit','delete','sell','restock','alert','system','login','signup'], default:'system' },
  message: { type:String, required:true },
  icon:    { type:String, default:'📋' },
  color:   { type:String, default:'#6366f1' },
  meta:    { type:mongoose.Schema.Types.Mixed, default:{} },
}, { timestamps:true });

ActivitySchema.index({ user:1, createdAt:-1 });

module.exports = mongoose.model('Activity', ActivitySchema);