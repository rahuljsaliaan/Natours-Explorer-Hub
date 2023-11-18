const sendErrorDev = (error, res) => {
  res.status(error.statusCode).json({
    status: error.status,
    error: error,
    message: error.message,
    stack: error.stack,
  });
};

const sendErrorProd = (error, res) => {
  // operational error: send message to client
  if (error.isOperational)
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  // Programming or other unknown error: error details are not leaked to the user
  else {
    // Log the error
    console.error('ERROR 💥 ', error);

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

  if (process.env.NODE_ENV === 'development') sendErrorDev(error, res);
  else if (process.env.NODE_ENV === 'production') sendErrorProd(error, res);
};
