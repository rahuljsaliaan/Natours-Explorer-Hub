const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc)
      return next(
        new AppError(
          // get collection name and remove the (s)
          `No ${Model.collection.collectionName.slice(0, -1)} found with ID: ${
            req.params.id
          }`,
          404,
        ),
      );

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
