const express = require('express');
const { getOverview } = require('../controllers/viewsController');
const { getTour } = require('../controllers/tourController');

const router = express.Router();

router.get('/', getOverview);

router.get('/tour', getTour);

module.exports = router;
