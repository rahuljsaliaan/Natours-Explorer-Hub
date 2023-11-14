const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/APIFeatures');

// 1) MIDDLEWARE HANDLERS
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// 2) ROUTE HANDLERS
exports.getAllTours = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    // Tour.findOne({_id: req.params.id})
    const tour = await Tour.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.createTour = async (req, res) => {
  // const newTour = new Tour({
  //   /*data*/
  // });
  // newTour.save()

  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        newTour,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      // The updated document will be returned
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message,
    });
  }
};

// Aggregation Pipeline
exports.getTourStats = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message,
    });
  }
};
