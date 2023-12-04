const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
        [getModelName()]: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });
