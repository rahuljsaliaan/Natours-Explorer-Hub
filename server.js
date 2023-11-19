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

const server = app.listen(port, () => {
  console.log(`App started on port ${port}`);
});

// handling rejections
// NOTE: This kind of error might occur which are out of reach such as Database password error etc.
process.on('unhandledRejection', (error) => {
  console.error(error.name, error.message);
  console.log('UNHANDLED REJECTION 💥 Shutting down...');

  // NOTE: The server.close() method can be used to close the server gracefully, which means that all outstanding requests will be finished before the server is closed. To close the server gracefully, you can use the following code:
  server.close(() => {
    // stop the entire node application
    process.exit(1);
  });
});
