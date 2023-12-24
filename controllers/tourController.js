const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

// NOTE: multerFilter is a multer filter that filters out files that are not images. (It runs for each of the file in the files array)
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Not an image! Please upload only images.', 400), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (image, i) => {
      const imageName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imageName}`);

      req.body.images[i] = imageName;
    }),
  );

  next();
});

// NOTE: For multiple images use upload.array('images', 5)
// upload.array('images', 5);

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

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/200/center/23,-23/unit/km
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  // NOTE: To convert the distance into radiance we need to divide it by the distance of the earth
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng)
    return next(new AppError('Please provide in the format lat,lng', 400));

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng)
    return next(new AppError('Please provide in the format lat,lng', 400));

  const distances = await Tour.aggregate([
    {
      // NOTE: Needs the startLocation to be indexed
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [+lng, +lat],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      // The fields that we want to keep
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: {
      distances,
    },
  });
});
