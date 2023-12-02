const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('./utils/xssClean');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// MIDDLEWARES

// Security HTTP Headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development')
  // NOTE: Morgan function also returns a call back function with the req,res and next
  app.use(morgan('dev'));

// Limit to one hundred limit in one hour per IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});

// Set limiter only for /api route
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(
  express.json({
    limit: '16kb',
  }),
);

// Data sanitization against NoSQL data injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xssClean());

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
