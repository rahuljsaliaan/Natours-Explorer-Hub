const express = require('express');
const morgan = require('morgan');

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
  res.status(404).json({
    status: 'fail',
    message: `Cannot find ${req.originalUrl} on this server`,
  });
});

module.exports = app;
