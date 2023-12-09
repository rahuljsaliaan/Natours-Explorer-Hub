const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');

// SCHEMAS
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      required: [true, 'A tour must have a name'],
      maxLength: [40, 'A tour name must have less or equal than 40 characters'],
      minLength: [10, 'A tour name must have more or equal than 10 characters'],
      validate: {
        validator: function (val) {
          return validator.isAlpha(val, 'en-US', { ignore: ' -' });
        },
        message:
          "A tour name can contain only alphabets, white spaces and '-' characters ",
      },
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
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      // A common trick to round off the decimal values
      set: (val) => Math.round(val * 10) / 10, // 4.6666 , 46.666 , 47 , 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // Custom validation
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    },
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
      default: Date.now,
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      // NOTE: GeoJSON is a special format for defining geo spatial data (contains at least two sub objects i:e type, coordinates)
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      // lat and lng
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: ['Point'],
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },

  // Virtual Schema Properties
  {
    // Including the virtual properties in both JSON and object output
    // NOTE: virtual properties cannot be used in the query, because they are not the part of the database
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    // NOTE: By default it creates extra id property which is excluded by setting to false
    id: false,
  },
);

// NOTE: Always index with high read write ratio do not index the data with the high write read ratio
// Index the price field in ascending order and ratingsAverage in descending order
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

// VIRTUAL PROPERTIES  (To get a new property from the existing property through calculation)
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  // foreign field of review
  foreignField: 'tour',
  // local field of review (ObjectId)
  localField: '_id',
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create()
// Pre save hook
tourSchema.pre('save', function (next) {
  // this refers to the document object
  this.slug = slugify(this.name, { lower: true });

  next();
});

// Embedding the user documents into the tour document
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// runs after .save() and .create()
// Post save hook
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE: NOTE: runs before the .find() method is EXECUTED of the query object
// tourSchema.pre('find', function (next) {
// NOTE: Executed for all the function staring with find ie: find, findOne, findOneAndDelete etc
tourSchema.pre(/^find/, function (next) {
  // this refers to the query object
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// POPULATE MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// runs after the .find() method is EXECUTED
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  // Adding a match stage to the beginning of the aggregation pipeline

  // NOTE: The reason we are accessing the pipeline though pipeline method is because the pipeline property is protected property which is denoted as _pipeline hence it is against the oop principal to access these properties directly and hence we access them using a getter method called pipeline
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } },
  });

  next();
});

// MODELS
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
