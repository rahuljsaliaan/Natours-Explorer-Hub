const fs = require('fs');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
);

// Check ID middleware
exports.checkId = (req, res, next, val) => {
  if (+val > tours.length)
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });

  next();
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price)
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price',
    });

  next();
};

// 2) ROUTE HANDLERS
exports.getAllTours = (req, res) => {
  res.status(200).json({
    // jsend format
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
};

exports.getTour = (req, res) => {
  const id = Number(req.params.id);
  const tour = tours.find((ele) => ele.id === id);

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

exports.createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;

  const tour = { id: newId, ...req.body };
  tours.push(tour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    () => {
      // 201 means created
      res.status(201).json({
        status: 'success',
        data: {
          tour,
        },
      });
    },
  );
};

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: `<Updated tour ${Object.keys(req.body)} ${Object.values(
        req.body,
      )} here...>`,
    },
  });
};

exports.deleteTour = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: null,
  });
};
