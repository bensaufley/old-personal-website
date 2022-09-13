import day from 'dayjs';
import path from 'path';
import inflection from 'inflection';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url)); // replaces __dirname in ESM

const title = process.argv[2] || 'New Post';
const date = day(process.argv[3]);
const slug = inflection.dasherize(title.toLocaleLowerCase());
const filePath = path.resolve(dirname, `../../source/posts/${date.format('YYYY/MM')}`);
const readablePath = path.relative(path.resolve(dirname, '../..'), filePath);

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
  console.error('Encountered error when writing file:', (err as Error).toString());
}
