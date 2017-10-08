const pump = require('pump');

module.exports = (...streams) => new Promise((resolve, reject) => {
  pump(...streams, (err) => {
    if (err) return reject(err);
    else resolve();
  });
});
