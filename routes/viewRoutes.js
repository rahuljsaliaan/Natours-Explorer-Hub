const express = require('express');
const {
  getOverview,
  getTour,
  getLoginForm,
  getSignupForm,
  getAccount,
  getResetPasswordForm,
  // updateUserData,
} = require('../controllers/viewsController');
const {
  isLoggedIn,
  protect,
  forgotPassword,
} = require('../controllers/authController');

const router = express.Router();

// NOTE: We don't need this route because we are using the API to update the user data
// router.post('/submit-user-data', protect, updateUserData);

router.get('/', isLoggedIn, getOverview);

router.get('/me', protect, getAccount);

router.post('/forgotPassword', forgotPassword);

router.get('/login', isLoggedIn, getLoginForm);

router.get('/tour/:slug', isLoggedIn, getTour);

router.get('/signup', isLoggedIn, getSignupForm);

router.get('/resetPassword/:token', isLoggedIn, getResetPasswordForm);

module.exports = router;
