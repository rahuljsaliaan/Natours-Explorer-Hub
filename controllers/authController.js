const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, passwordChangedAt } =
    req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
  });

  // CREATING TOKEN
  // payload, secret, options
  const token = signToken(newUser._id);

  // SEND RESPONSE WITH TOKEN
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: {
        name: newUser.name,
        email: newUser.email,
      },
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) CHECK IF EMAIL AND PASSWORD EXISTS
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) CHECK IF USER EXISTS && PASSWORD IS CORRECT
  const user = await User.findOne({ email }).select('+password');

  // NOTE: The reason why we are calling the user.correctPassword inside the if statement because it's an asynchronous code and so the if block will be executed before the password in compared and so we use them inside the if statement to make the entire if statement asynchronous and correct.
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // 3) IF EVERYTHING IS OK, SEND TOKEN TO CLIENT
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) GETTING TOKEN AND CHECK IF IT'S THERE
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token)
    return next(
      new AppError('You are not logged in! Please login to get access', 401),
    );

  // 2) VERIFICATION OF TOKEN
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) CHECK IF USER STILL EXISTS
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError('The user belonging to this token does not exist', 401),
    );

  // 4) CHECK IF USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUED
  if (await currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('User recently changed password! Please login again', 401),
    );

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;

  next();
});
