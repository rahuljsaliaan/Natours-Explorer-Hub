const fs = require('fs');
const express = require('express');
const app = express();

// middleware
app.use(express.json());

app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');

  // NOTE: the next function is called to continue the request response cycle
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

const port = 3000;

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

const getAllTours = (req, res) => {
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

const getTour = (req, res) => {
  const id = Number(req.params.id);
  const tour = tours.find((ele) => ele.id === id);

  if (!tour)
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

const createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  // Merging two objects
  const tour = Object.assign({ id: newId }, req.body);

  tours.push(tour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (error) => {
      // 201 means created
      res.status(201).json({
        status: 'success',
        data: {
          tour,
        },
      });
    }
  );
};

const updateTour = (req, res) => {
  const id = Number(req.params.id);
  const tour = tours.find((ele) => ele.id === id);

  if (!tour)
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });

  res.status(200).json({
    status: 'success',
    data: {
      tour: `<Updated tour ${Object.keys(req.body)} ${Object.values(
        req.body
      )} here...>`,
    },
  });
};

const deleteTour = (req, res) => {
  const id = Number(req.params.id);
  const tour = tours.find((ele) => ele.id === id);

  if (!tour)
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });

  res.status(204).json({
    status: 'success',
    data: null,
  });
};

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

app.route('/api/v1/tours').get(getAllTours).post(createTour);

app
  .route('/api/v1/tours/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

app.listen(port, () => {
  console.log('App started on port 3000');
});
