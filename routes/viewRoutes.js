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

router.get('/me', protect, getAccount);

router.post('/forgotPassword', forgotPassword);

// NOTE: We don't need this route because we are using the API to update the user data
// router.post('/submit-user-data', protect, updateUserData);

router.use(isLoggedIn);

router.get('/', getOverview);

router.get('/tour/:slug', getTour);

router.get('/login', getLoginForm);

router.get('/signup', getSignupForm);

router.get('/resetPassword/:token', getResetPasswordForm);

module.exports = router;
