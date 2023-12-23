const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = (err) => {
  const message = `Duplicate field value: ${err.keyValue.email}. Please use another value`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const message = `Please correct the following errors: ${err.message}`;

  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired', 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // API
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // RENDERED WEBSITE
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      message: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // operational error: send message to client
  // API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational)
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    // Programming or other unknown error: error details are not leaked to the user

    // Log the error
    console.error('ERROR 💥 ', err);

    // Send generic message
    return res.status(500).json({
      status: 500,
      message: 'Something went very wrong',
    });
  }

  // RENDERED WEBSITE
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      message: err.message,
    });
    // Programming or other unknown error: error details are not leaked to the user
  } else {
    console.error('ERROR 💥💥 ', err);

    // Send generic message
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      message: 'Something went very wrong',
    });
  }
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let err = { name: error.name, message: error.message, ...error };

    // ID not found error
    if (err.name === 'CastError') err = handleCastErrorDB(err);

    // Duplicate id error
    if (err.code === 11000) err = handleDuplicateErrorDB(err);

    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);

    if (err.name === 'JsonWebTokenError') err = handleJWTError();

    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();

    sendErrorProd(err, req, res);
  }
};
