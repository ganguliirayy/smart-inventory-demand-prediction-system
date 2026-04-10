// Email validation
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Phone validation (Indian phone number)
const isValidPhone = (phone) => {
  if (!phone) return true; // Optional field
  const regex = /^[0-9]{10}$/;
  return regex.test(phone.replace(/\D/g, ''));
};

// Password validation
const isValidPassword = (password) => {
  // Min 6 chars, at least 1 letter and 1 number
  const regex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
  return regex.test(password);
};

// Pin code validation (Indian)
const isValidPincode = (pincode) => {
  if (!pincode) return true;
  const regex = /^[0-9]{6}$/;
  return regex.test(pincode.toString());
};

// GST number validation (India)
const isValidGST = (gst) => {
  if (!gst) return true;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
  return regex.test(gst);
};

// License validation (basic)
const isValidLicense = (license) => {
  if (!license) return true;
  return license.toString().length >= 5;
};

// Batch number validation
const isValidBatch = (batch) => {
  if (!batch) return true;
  return batch.toString().length >= 2 && batch.toString().length <= 20;
};

// HSN code validation (6 digits)
const isValidHSN = (hsn) => {
  if (!hsn) return true;
  const regex = /^[0-9]{6,8}$/;
  return regex.test(hsn);
};

// Quantity validation
const isValidQuantity = (qty) => {
  return !isNaN(qty) && qty > 0 && Number.isInteger(Number(qty));
};

// Price validation
const isValidPrice = (price) => {
  return !isNaN(price) && price >= 0 && price <= 1000000;
};

// Date validation
const isValidDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

// Expiry date should be in future
const isValidExpiryDate = (date) => {
  if (!isValidDate(date)) return false;
  return new Date(date) > new Date();
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidPincode,
  isValidGST,
  isValidLicense,
  isValidBatch,
  isValidHSN,
  isValidQuantity,
  isValidPrice,
  isValidDate,
  isValidExpiryDate,
};
