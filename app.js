const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARES

if (process.env.NODE_ENV === 'development')
  // NOTE: Morgan function also returns a call back function with the req,res and next
  app.use(morgan('dev'));

app.use(express.json());

// middle to create access to static files
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// The root route middleware (mounting a new router on a route)
app.use('/api/v1/tours', tourRouter);

app.use('/api/v1/users', userRouter);

// Default route
app.all('*', (req, res, next) => {
  // NOTE: the express will know that it is error object being passed and all other middle ware will be skipped and the error middle ware will be executed
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// ERROR MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
