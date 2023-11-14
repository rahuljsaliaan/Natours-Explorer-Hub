const mongoose = require('mongoose');
const slugify = require('slugify');
// SCHEMAS
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      required: [true, 'A tour must have a name'],
    },
    slug: String,
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
      select: false,
    },
    startDates: [Date],
  },
  {
    // Including the virtual properties in both JSON and object output
    // NOTE: virtual properties cannot be used in the query, because they are not the part of the database
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    // NOTE: By default it creates extra id property which is excluded by setting to false
    id: false,
  },
);

// VIRTUAL PROPERTIES  (To get a new property from the existing property through calculation)
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create()
// Pre save hook
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});

// runs after .save() and .create()
// Post save hook
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// MODELS
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
