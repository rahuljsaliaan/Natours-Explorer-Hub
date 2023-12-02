const xss = require('xss');

const xssClean = () => (req, res, next) => {
  Object.keys(req.body).forEach((key) => {
    if (typeof req.body[key] === 'string') req.body[key] = xss(req.body[key]);
  });

  next();
};

module.exports = xssClean;
