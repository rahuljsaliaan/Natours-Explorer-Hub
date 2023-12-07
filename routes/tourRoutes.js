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

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin'), createTour);

router.use(protect, restrictTo('admin'));

router
  .route('/:id')
  .get(restrictTo('lead-guide', 'guide'), getTour)
  .patch(updateTour)
  .delete(restrictTo('lead-guide'), deleteTour);

router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tour-stats').get(getTourStats);

router.route('/monthly-plan/:year').get(getMonthlyPlan);

// router
//   .route('/:tourId/reviews')
//   .post(protect, restrictTo('user'), createReview);

module.exports = router;
