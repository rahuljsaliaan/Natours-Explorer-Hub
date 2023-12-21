const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createTokenSend = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieExpiresInMilliseconds = new Date(
    Date.now() +
      process.env.JWT_COOKIE_EXPIRES_IN *
        24 *
        60 *
        60 *
        1000 /* Convert time in milliseconds */,
  );

  const cookieOptions = {
    expires: cookieExpiresInMilliseconds,
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  };

  // Set a cookie
  res.cookie('jwt', token, cookieOptions);

  user.password =
    undefined; /* Remove password from the response via /signup route */

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, role, password, passwordConfirm } = req.body;

  const newUser = await User.create({
    name,
    email,
    role,
    password,
    passwordConfirm,
  });

  // CREATING TOKEN
  // payload, secret, options

  // SEND RESPONSE WITH TOKEN
  createTokenSend(
    {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    },
    201,
    res,
  );
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) CHECK IF EMAIL AND PASSWORD EXISTS
  if (!email || !password)
    return next(new AppError('Please provide email and password!', 400));

  // 2) CHECK IF USER EXISTS && PASSWORD IS CORRECT
  const user = await User.findOne({ email }).select('+password');

  // NOTE: The reason why we are calling the user.correctPassword inside the if statement because it's an asynchronous code and so the if block will be executed before the password in compared and so we use them inside the if statement to make the entire if statement asynchronous and correct.
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));

  // 3) IF EVERYTHING IS OK, SEND TOKEN TO CLIENT
  createTokenSend(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) GETTING TOKEN AND CHECK IF IT'S THERE
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
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
  // NOTE: We are creating this so that the next middleware (eg: restrictTo) can have access to the current user
  req.user = currentUser;

  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // NOTE: req.user is coming from the protect middleware
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) GET USER BASED ON POSTED EMAIL
  const user = await User.findOne({ email: req.body.email });

  if (!user) return next(new AppError('There is no user with that email', 404));

  // 2) GENERATE RANDOM TOKEN
  const resetToken = await user.createPasswordResetToken();

  // NOTE: Disabling validation to be able to store the token without other required fields
  await user.save({ validateBeforeSave: false });

  // 3) SEND IT TO USER'S EMAIL
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token for 10 min',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;

    // NOTE: Disabling validation to be able to store the token without other required fields
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email. Try again later!', 500),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) GET USER BASED ON TOKEN
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) IF TOKEN NOT EXPIRED AND THERE IS A USER, SET THE NEW PASSWORD
  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) UPDATE THE changedPasswordAt PROPERTY FOR THE USER

  // 4) LOG THE USER IN, SEND JWT
  createTokenSend(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) GET USER FROM COLLECTION
  const { currentPassword, password, passwordConfirm } = req.body;

  // NOTE: current user is already there in the req object as the usr is already logged in.
  const user = await User.findById(req.user.id).select('+password');

  // 2) CHECK IF THE POSTed PASSWORD IS CORRECT
  if (!(await user.correctPassword(currentPassword, user.password)))
    return next(new AppError('Your current password is wrong', 401));

  // 3) IF SO UPDATE THE PASSWORD
  user.password = password;
  user.passwordConfirm = passwordConfirm;

  // NOTE: not to use update only use save or create related to password for the validations and pre save hook to run
  await user.save();

  // 4) LOG THE USER IN, SEND JWT
  createTokenSend(user, 200, res);
});
