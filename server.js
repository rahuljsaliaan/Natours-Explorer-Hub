const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Setting environment variables
dotenv.config({ path: `${__dirname}/config.env` });

const app = require('./app');

// Connecting to database
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connected successfully'));

// SCHEMAS
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
});

// MODELS
const Tour = mongoose.model('Tour', tourSchema);

const testTour = new Tour({
  name: 'The Park Hiker',
  price: 997,
});

testTour
  .save()
  .then((doc) => console.log(doc))
  .catch((error) => console.log('ERROR 💥', error));

// 4) START THE SERVER
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App started on port ${port}`);
});
