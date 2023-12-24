const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
// const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build template

  // 3) Render that template using tour data from 1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data, for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review user rating',
  });

  // if (!tour) {
  //   return next(new AppError('There is no tour with that name.', 404));
  // }

  // 2) Build template

  // 3) Render template using data from 1)
  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});

exports.getSignupForm = catchAsync(async (req, res) => {
  res.status(200).render('signup', {
    title: 'Create your account',
  });
});

exports.getAccount = catchAsync(async (req, res) => {
  // NOTE: we don't need to fetch the user because we already have it in the req.locals object through protect middleware
  res.status(200).render('account', {
    title: 'Your account',
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).render('account', {
    title: 'Your account',
    // NOTE: we are passing the updated user to the template so that the user can see the updated data
    user: updatedUser,
  });
});

exports.getResetPasswordForm = catchAsync(async (req, res) => {
  res.status(200).render('resetPassword', {
    title: 'Reset your password',
    token: req.params.token,
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  // NOTE: Better option is virtual populate but we are using this for understanding that we can also do it this way
  const tourIDs = bookings.map((el) => el.tour);

  // NOTE: We are using the $in operator to find all tours whose ID is in the tourIDs array
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.alerts = (req, res, next) => {
  const { alert } = req.query;

  if (alert === 'booking') {
    res.locals.alert =
      "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up here immediately, please come back later.";
  }

  next();
};
