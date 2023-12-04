const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const { deleteOne, updateOne, createOne } = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter;
  if (req.params.tourId) filter = { tour: req.params.tourId };

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review)
    next(new AppError(`No review found with ID: ${req.params.id}`, 404));

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.createReview = createOne(Review);

exports.updateReview = updateOne(Review);

exports.deleteReview = deleteOne(Review);
