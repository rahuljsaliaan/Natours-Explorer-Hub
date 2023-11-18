const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/APIFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// 1) MIDDLEWARE HANDLERS
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// 2) ROUTE HANDLERS
exports.getAllTours = catchAsync(async (req, res) => {
  // {
  // DEPRECATED
  // if (req.query.page) {
  //   // NOTE: The reason for called the countDocuments on the Tour model because the query might have different sets of values compared to original sets of values in the collection
  //   const numTours = await Tour.countDocuments();
  //   if (skip >= numTours) throw new Error('This page does not exist');
  // }
  // const query = Tour.find()
  //   .where('duration')
  //   .equals(5)
  //   .where('difficulty')
  //   .equals('easy');
  // }

  // EXECUTE QUERY
  // PARAMETERS: query: return by the Tour modal, queryString: the query property of the req object
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    // jsend format
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // Tour.findOne({_id: req.params.id})
  const tour = await Tour.findById(req.params.id);

  if (!tour)
    return next(new AppError(`No tour found with ID: ${req.params.id}`, 404));

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res) => {
  // const newTour = new Tour({
  //   /*data*/
  // });
  // newTour.save()

  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      newTour,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    // The updated document will be returned
    new: true,
    runValidators: true,
  });

  if (!tour)
    return next(new AppError(`No tour found with ID: ${req.params.id}`, 404));

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour)
    return next(new AppError(`No tour found with ID: ${req.params.id}`, 404));

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Aggregation Pipeline
exports.getTourStats = catchAsync(async (req, res) => {
  // AGGREGATE PIPELINE
  const stats = await Tour.aggregate([
    {
      // stage 1
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      // stage 2
      $group: {
        // group all the tours together
        // _id: null,

        // group by difficulty
        _id: { $toUpper: '$difficulty' },

        // NOTE: numTours act likes a counter i:e for each of the document it goes through it adds one
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      // Sort by avgPrice in ascending order
      // Stage 3
      // NOTE: There is a reason why we are using avgPrice is because the document is already grouped by reaching this stage and the avgPrice will be available heres
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = +req.params.year;

  // AGGREGATE PIPELINE
  const plan = await Tour.aggregate([
    {
      // Destructure the startDates array
      $unwind: '$startDates',
    },
    {
      // Only match the documents with the specified dates (year)
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      // Group according to month and also add the tour name into the tours array
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      // Make the id field as month field
      $addFields: { month: '$_id' },
    },
    {
      // Remove the _id field
      $project: { _id: 0 },
    },
    {
      // Sort in Descending order of numToursStarts
      $sort: { numTourStarts: -1 },
    },
    {
      // Limit the results to only 12 months
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan,
    },
  });
});
