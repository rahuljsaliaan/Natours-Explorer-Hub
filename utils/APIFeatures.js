class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // BUILD QUERY
    const queryObj = { ...this.queryString };

    // Filter out the excluded fields from the query object
    const excludedFields = ['page', 'sort', 'limit', 'field'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // example output: {duration: {$gte: 5}} $ = mongodb operator to specify a conditional operation

    // The find method returns a query which will be resolved to a object of data that was queried
    this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // SORTING
    if (this.queryString.sort) {
      // Replace comma's by a space to match the criteria of the mongodb sorting
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      // query.sort('price ratingsAverage')
    } else {
      // NOTE: Always sort with a unique value included in it
      this.query.sort('-createdAt _id');
      // query.sort('ratingsAverage');
    }

    return this;
  }

  limitFields() {
    // LIMITING FIELDS
    if (this.queryString.field) {
      const fields = this.queryString.field.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    // PAGINATION WITH LIMIT
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
