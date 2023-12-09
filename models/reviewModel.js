const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    // JSON.stringify(user) // '{"firstName":"John","lastName":"Doe"}'
    // user.toObject() // { firstName: 'John', lastName: 'Doe' }
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// Static method that can be directly called on Model (not on instances)

// NOTE: The reason why we are calling the static method on the model and not on the document is because the static method is called on the model and not on the document and so the this keyword will point to the model and not the document and so we need to pass the tourId as an argument to the static method.
reviewSchema.statics.calculateAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    // NOTE: The reason we still need the $group stage even after $match has filtered the documents is because $group not only groups the documents but also applies accumulator expressions to perform calculations on the grouped data.
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      // NOTE: stats is an array of objects and so we need to access the first object and then access the properties of that object
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating,
    });
    // NOTE: the reason we are implementing else part is because when we delete all the reviews of a tour then the stats array will be empty and so we need to set the ratingsQuantity and ratingsAverage back to default values
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// NOTE: pre and post are only called on instance methods and not on static methods and so we need to call the static method inside the post middleware of the instance method
reviewSchema.post('save', async function () {
  // NOTE: this.constructor points to the model that created the document and so we can call the static method on the model
  await this.constructor.calculateAverageRatings(this.tour);
});

// findOneAndUpdate
// findOneAndDelete
// NOTE: queryMiddle ware do not have access to the current document and so we need to manually get the document using the findOne() method
// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   // NOTE: the reason we are passing the reviewDoc to the post middleware is because the post middleware does not have access to the query and so we need to pass the document to the post middleware and only post middleware can calculate the average ratings because the of the current updated review being available in the post middleware
//   this.reviewDoc = await this.findOne();

//   next();
// });

// // NOTE: this.reviewDoc.constructor points to the model that created the document and so we can call the static method on the model
// reviewSchema.post(/^findOneAnd/, async function () {
//   await this.reviewDoc.constructor.calculateAverageRatings(this.reviewDoc.tour);
// });

// NOTE: No need to pass the document to the post middleware because the post middleware has access to the current document
reviewSchema.post(/^findOneAnd/, async (doc) => {
  await doc.constructor.calculateAverageRatings(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
