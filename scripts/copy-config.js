/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');
const { print } = require('./print');

const source = path.normalize(`${__dirname}/../src/config.json`);
const destination = path.normalize(`${__dirname}/../dist/src/config.json`);

fs.copyFile(source, destination, (error) => {
  if (error) {
    throw error;
  } else {
    print(null, `config.json was copied to ${destination}`);
  }
});
