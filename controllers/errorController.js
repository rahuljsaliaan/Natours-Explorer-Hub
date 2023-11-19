const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = (err) => {
  const message = `Duplicate field value: ${err.keyValue.name}. Please use another value`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const message = `Please correct the following errors: ${err.message}`;

  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // operational error: send message to client
  if (err.isOperational)
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  // Programming or other unknown error: error details are not leaked to the user
  else {
    // Log the error
    console.error('ERROR 💥 ', err);

    // Send generic message
    res.status(500).json({
      status: 500,
      message: 'Something went very wrong',
    });
  }
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else if (process.env.NODE_ENV === 'production') {
    let err = { name: error.name, message: error.message, ...error };

    // ID not found error
    if (err.name === 'CastError') err = handleCastErrorDB(err);

    // Duplicate id error
    if (err.code === 11000) err = handleDuplicateErrorDB(err);

    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);

    sendErrorProd(err, res);
  }
};
