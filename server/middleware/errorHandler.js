const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';
  const errors   = {};

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    statusCode = 409;
    errors[field] = message;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    Object.keys(err.errors).forEach(f => { errors[f] = err.errors[f].message; });
  }

  if (err.name === 'CastError') { statusCode = 400; message = 'Invalid ID format'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Session expired — please login again'; }
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token'; }

  if (process.env.NODE_ENV === 'development') {
    console.error(`❌ [${statusCode}] ${message}`);
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(Object.keys(errors).length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;