const app = require(`${__dirname}/app`);

// 4) START THE SERVER
const port = 3000;

app.listen(port, () => {
  console.log('App started on port 3000');
});
