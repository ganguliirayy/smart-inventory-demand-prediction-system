// Trim and sanitize strings
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '').slice(0, 500);
};

// Sanitize numbers
const sanitizeNumber = (num) => {
  const parsed = parseFloat(num);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
};

// Sanitize object - remove sensitive fields
const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Sanitize input object
const sanitizeInput = (obj) => {
  const sanitized = {};
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === 'number') {
      sanitized[key] = sanitizeNumber(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
};

module.exports = {
  sanitizeString,
  sanitizeNumber,
  sanitizeUser,
  sanitizeInput,
};
