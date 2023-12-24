const express = require('express');
const {
  getOverview,
  getTour,
  getLoginForm,
  getSignupForm,
  getAccount,
  getResetPasswordForm,
  getMyTours,
  // updateUserData,
} = require('../controllers/viewsController');
const {
  isLoggedIn,
  protect,
  forgotPassword,
} = require('../controllers/authController');
// const { createBookingCheckout } = require('../controllers/bookingController');

const router = express.Router();

// NOTE: We don't need this route because we are using the API to update the user data
// router.post('/submit-user-data', protect, updateUserData);

router.get('/', isLoggedIn, /*createBookingCheckout ,*/ getOverview);

router.get('/me', protect, getAccount);

router.get('/my-tours', protect, getMyTours);

router.post('/forgotPassword', forgotPassword);

router.get('/login', isLoggedIn, getLoginForm);

router.get('/tour/:slug', isLoggedIn, getTour);

router.get('/signup', isLoggedIn, getSignupForm);

router.get('/resetPassword/:token', isLoggedIn, getResetPasswordForm);

module.exports = router;
