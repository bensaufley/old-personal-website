/* eslint-disable no-console */
const express = require('express');

const config = require('./config');

const server = express();

server.use(express.static('./dist'));

server.listen(config.devServerPort, () => {
  console.log(`Now listening at http://localhost:${config.devServerPort}…`);
});
