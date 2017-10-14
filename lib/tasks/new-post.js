const fs = require('mz/fs'),
      mkdirp = require('mkdirp-promise'),
      moment = require('moment'),
      path = require('path');

const title = process.argv[2] || 'New Post',
      date = moment(process.argv[3]),
      slug = title.trim()
        .toLowerCase()
        .replace(/('’)/g, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/(^-|-$)/g, ''),
      filePath = path.resolve(__dirname, `../../source/posts/${date.format('YYYY/MM')}`);

const content = `---
title: ${title.trim()}
date: ${date.format()}
---
`;

console.log(`Creating new post at ${filePath}/${slug}.md…`);
mkdirp(filePath)
  .then(() => fs.writeFile(`${filePath}/${slug}.md`, content))
  .then(() => { console.log('Done'); })
  .catch((err) => {
    console.error('Encountered error when writing file:', err.toString());
  });
