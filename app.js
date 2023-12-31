const path = require('path');
const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const xssClean = require('./utils/xssClean');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const { webhookCheckout } = require('./controllers/bookingController');

const app = express();

app.set('trust proxy', 1);

// origin: 'https://natours-frontend.com/', // example: for only one domain
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// NOTE: The preflight phase is the phase where the browser checks if the request is safe to send, that is why we need to set the cors headers for the preflight phase
app.options('*', cors());

// Setting up PUG
app.set('view engine', 'pug');
// NOTE: path.join will join the current directory with the views folder
app.set('views', path.join(__dirname, 'views'));

// MIDDLEWARES

// middle to create access to static files
app.use(express.static(path.join(__dirname, 'public')));

// Security HTTP Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Allow inline scripts
          'https://unpkg.com',
          'https://cdnjs.cloudflare.com',
          'https://js.stripe.com/v3/',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://unpkg.com',
          'https://cdnjs.cloudflare.com',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'https://unpkg.com',
          'https://*.tile.openstreetmap.org',
          'https://cdnjs.cloudflare.com',
        ],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", 'https://js.stripe.com/'],
      },
    },
  }),
);

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

// Webhook
// NOTE: The reason we are using this route here is because we need to access the raw body of the request and stripe needs the raw body to be in a certain format
// NOTE: The express.raw() will parse the body into a buffer and we need to convert it into a string
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout,
);

// Body parser, reading data from body into req.body
app.use(
  express.json({
    limit: '16kb',
  }),
);

// NOTE: This is used to parse the data coming from the form, Which is not recommended way of sending data to the server
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie Parser
app.use(cookieParser());

// Data sanitization against NoSQL data injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xssClean());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use(compression());

// The route middleware (mounting a new router on a route)
// Pug template
app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);

app.use('/api/v1/users', userRouter);

app.use('/api/v1/reviews', reviewRouter);

app.use('/api/v1/bookings', bookingRouter);

// Default route
app.all('*', (req, res, next) => {
  // NOTE: the express will know that it is error object being passed and all other middle ware will be skipped and the error middle ware will be executed
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// ERROR MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
