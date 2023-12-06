const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');

// 1) MIDDLEWARE HANDLERS
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// 2) ROUTE HANDLERS
exports.getAllTours = getAll(Tour);

exports.getTour = getOne(Tour, { path: 'reviews' });

// const newTour = new Tour({
//   /*data*/
// });
// newTour.save()

exports.createTour = createOne(Tour);

exports.updateTour = updateOne(Tour);

exports.deleteTour = deleteOne(Tour);

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
