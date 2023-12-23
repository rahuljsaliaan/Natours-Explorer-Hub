const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { deleteOne, updateOne, getOne, getAll } = require('./handlerFactory');

// NOTE: multerStorage is a multer storage engine that gives us full control over storing files
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // NOTE: cb is callback function, just like next() in express
//     cb(null, 'public/img/users');
//   },

//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1]; // NOTE: file.mimetype = image/jpeg, so we split it to get the extension
//     // user-<user-id>-<timestamp>.extension
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// NOTE: multer memory storage engine gives us access to the file in memory as a buffer
const multerStorage = multer.memoryStorage();

// NOTE: multerFilter is a multer filter that filters out files that are not images
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Not an image! Please upload only images', 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// Upload the user photo
exports.uploadPhoto = upload.single('photo');

// Resize the user photo
exports.resizeUserPhoto = (req, res, next) => {
  // NOTE: If there is no file, then we don't need to resize the photo
  if (!req.file) return next();

  // user-<user-id>-<timestamp>.extension
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((ele) => {
    if (allowedFields.includes(ele)) newObj[ele] = obj[ele];
  });

  return newObj;
};

exports.getAllUsers = getAll(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) CREATE ERROR IF USER POSTS PASSWORD DATA
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400,
      ),
    );

  // 2) UPDATE THE USER DOCUMENT

  // NOTE: Filtered out unwanted fields that are not allowed
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use signup instead',
  });
};

exports.updateUser = updateOne(User);

exports.deleteUser = deleteOne(User);
