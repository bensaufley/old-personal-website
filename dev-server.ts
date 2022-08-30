/* eslint-disable no-console */
import express from 'express';

import config from './config';

const server = express();

server.use(express.static('./dist'));

server.listen(config.devServerPort, () => {
  console.log(`Now listening at http://localhost:${config.devServerPort}…`);
});
