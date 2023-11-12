const mongoose = require('mongoose');
// SCHEMAS
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    trim: true,
    required: [true, 'A tour must have a name'],
  },
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size'],
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
  priceDiscount: Number,
  summary: {
    type: String,
    // Removes all the white spaces
    trim: true,
    required: [true, 'A tour must have a summary'],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a cover image'],
  },
  // Array of Strings
  images: [String],
  createdAt: {
    type: Date,
    // Returns milliseconds which is immediately converted to Date (timestamp) by Mongo DB
    default: Date.now(),
  },
  startDate: [Date],
});

// MODELS
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
