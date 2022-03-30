const fs = require('mz/fs');
const mkdirp = require('mkdirp-promise');
const moment = require('moment');
const path = require('path');

const title = process.argv[2] || 'New Post';
const date = moment(process.argv[3]);
const slug = title
  .trim()
  .toLowerCase()
  .replace(/('’)/g, '')
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/(^-|-$)/g, '');
const filePath = path.resolve(__dirname, `../../source/posts/${date.format('YYYY/MM')}`);

const content = `---
title: ${title.trim()}
date: ${date.format()}
---
`;

console.log(`Creating new post at ${filePath}/${slug}.md…`);
mkdirp(filePath)
  .then(() => fs.writeFile(`${filePath}/${slug}.md`, content))
  .then(() => {
    console.log('Done');
  })
  .catch((err) => {
    console.error('Encountered error when writing file:', err.toString());
  });
