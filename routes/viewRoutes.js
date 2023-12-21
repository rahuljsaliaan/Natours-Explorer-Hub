const express = require('express');
const {
  getOverview,
  getTour,
  getLoginForm,
} = require('../controllers/viewsController');
const { protect } = require('../controllers/authController');

const router = express.Router();

router.get('/', getOverview);

router.get('/tour/:slug', protect, getTour);

router.get('/login', getLoginForm);

module.exports = router;
