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

// 4) START THE SERVER
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App started on port ${port}`);
});
