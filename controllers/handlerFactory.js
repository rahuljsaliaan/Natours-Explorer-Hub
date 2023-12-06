const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/APIFeatures');

const getModelName = (Model) => Model.collection.collectionName.slice(0, -1);

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc)
      return next(
        new AppError(
          // get collection name and remove the (s)
          `No ${getModelName(Model)} found with ID: ${req.params.id}`,
          404,
        ),
      );

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      // The updated document will be returned
      new: true,
      runValidators: true,
    });

    if (!doc)
      return next(
        new AppError(
          `No ${getModelName(Model)} found with ID: ${req.params.id}`,
          404,
        ),
      );

    res.status(200).json({
      status: 'success',
      data: {
        [getModelName(Model)]: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        [getModelName(Model)]: doc,
      },
    });
  });

exports.getOne = (Model, popOptions = null) =>
  catchAsync(async (req, res, next) => {
    const query = Model.findById(req.params.id);

    if (popOptions) query.populate(popOptions);

    const doc = await query;

    if (!doc)
      return next(
        new AppError(
          `No ${getModelName(Model)} found with ID: ${req.params.id}`,
          404,
        ),
      );

    res.status(200).json({
      status: 'success',
      data: {
        [getModelName(Model)]: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    // Only for review for particular tour
    let filter;
    if (req.params.tourId) filter = { tour: req.params.tourId };

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
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      // jsend format
      status: 'success',
      results: doc.length,
      data: {
        [getModelName(Model)]: doc,
      },
    });
  });
