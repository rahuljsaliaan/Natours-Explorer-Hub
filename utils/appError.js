class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // NOTE: This code will prevent the operational error from being included in the stack trace so that we can only observe the programming errors in the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
