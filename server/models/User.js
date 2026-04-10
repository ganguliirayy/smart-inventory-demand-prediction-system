const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, minlength: 6 }, // ✅ REMOVED select: false
  role:      { type: String, default: 'customer' },
  isAdmin:   { type: Boolean, default: false },
  isActive:  { type: Boolean, default: true },
  phone:     { type: String, default: '' },
  license:   { type: String, default: '' },
  regNo:     { type: String, default: '' },
  lastLogin: { type: Date, default: null },
  pharmacy: {
    storeName:   { type: String, default: 'My Pharmacy' },
    address:     { type: String, default: '' },
    city:        { type: String, default: '' },
    pincode:     { type: String, default: '' },
    gstNumber:   { type: String, default: '' },
    drugLicense: { type: String, default: '' },
    phone:       { type: String, default: '' },
    email:       { type: String, default: '' },
  },
}, { timestamps: true });

// ✅ Hash password ONLY during signup (not during update)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET || 'rxflow_secret_key_2024', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);