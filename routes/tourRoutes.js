const express = require('express');
const {
  aliasTopTours,
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
} = require('../controllers/tourController');
const reviewRouter = require('./reviewRoutes');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

// MIDDLEWARE
// router.param('id', checkId);

router.use('/:tourId/reviews', reviewRouter);

// ROUTES

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tour-stats').get(getTourStats);

router.route('/monthly-plan/:year').get(getMonthlyPlan);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin'), createTour);

router
  .route('/:id')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getTour)
  .patch(protect, restrictTo('admin'), updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

// router
//   .route('/:tourId/reviews')
//   .post(protect, restrictTo('user'), createReview);

module.exports = router;
