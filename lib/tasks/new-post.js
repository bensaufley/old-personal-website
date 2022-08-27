// @ts-check
const { writeFile } = require('fs/promises');
const moment = require('moment');
const path = require('path');
const { dasherize } = require('inflection');
const { mkdirSync, writeFileSync } = require('fs');

const title = process.argv[2] || 'New Post';
const date = moment(process.argv[3]);
const slug = dasherize(title.toLocaleLowerCase());
const filePath = path.resolve(__dirname, `../../source/posts/${date.format('YYYY/MM')}`);
const readablePath = path.relative(path.resolve(__dirname, '../..'), filePath);

const content = `---
title: ${title.trim()}
date: ${date.format()}
---
`;

try {
  console.log(`Creating new post at ${readablePath}/${slug}.md …`);
  console.debug('filePath: ', filePath);
  mkdirSync(filePath, { recursive: true });
  writeFileSync(`${filePath}/${slug}.md`, Buffer.from(content));
  console.log('Done');
} catch (err) {
  console.error('Encountered error when writing file:', err.toString());
}
