const fs = require('fs');
const express = require('express');
const app = express();

// middleware
app.use(express.json());

const port = 3000;

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    // jsend format
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

app.post('/api/v1/tours', (req, res) => {
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
});

app.listen(port, () => {
  console.log('App started on port 3000');
});
