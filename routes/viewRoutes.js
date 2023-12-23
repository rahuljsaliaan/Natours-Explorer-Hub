const express = require('express');
const {
  getOverview,
  getTour,
  getLoginForm,
  getSignupForm,
  getAccount,
} = require('../controllers/viewsController');
const { isLoggedIn, protect } = require('../controllers/authController');

const router = express.Router();

router.get('/me', protect, getAccount);

router.use(isLoggedIn);

router.get('/', getOverview);

router.get('/tour/:slug', getTour);

router.get('/login', getLoginForm);

router.get('/signup', getSignupForm);

module.exports = router;
