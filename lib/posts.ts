import { marked } from 'marked';
import path, { basename, extname } from 'path';
import through from 'through2';
import Vinyl from 'vinyl';
import type vinyl from 'vinyl';

import day from './day';

type Callback = (err?: Error | null | undefined, chunk?: vinyl) => void;

export const catchThrough = (func: (chunk: vinyl, cb: Callback) => void) =>
  through.obj((chunk, _, callback) => {
    try {
      func(chunk, callback);
    } catch (err) {
      callback(err);
    }
  });

export const excerpt = () =>
  catchThrough((chunk, callback) => {
    const contents = String(chunk.contents);

    if (contents.indexOf('<!--more-->') === -1) {
      callback(null, chunk);
      return;
    }

    const ext = path.extname(chunk.path);
    const link = chunk.path.substr(chunk.base.length, chunk.path.length - chunk.base.length - ext.length);

    chunk.contents = Buffer.from(`${contents.split('<!--more-->')[0]}\n\n[Read more…](${link}/)`);

    callback(null, chunk);
  });

export const extractFootnotes = (index = false) =>
  catchThrough((chunk, callback) => {
    let footnotes: string[] = [];
    let contents = String(chunk.contents);

    if (!/\[ref\]/.test(contents)) {
      callback(null, chunk);
      return;
    }

    contents = contents.replace(/\[ref\](.+?)\[\/ref\]/gim, (_, footnote) => {
      footnotes = [...footnotes, footnote];
      const fnI = footnotes.length;
      const date = day.tz(chunk.frontMatter.date);
      return `<a class="footnote" id="footnote-ref-${fnI}" href="/${date.format('YYYY/MM')}/${basename(
        chunk.basename,
        extname(chunk.basename),
      )}/#footnote-${fnI}">${fnI}</a>`;
    });

    if (!index) {
      contents = `${contents.trim()}\n\n<ol class="footnotes">${footnotes
        .map(
          (footnote, i) =>
            `<li id="footnote-${i + 1}">${marked(
              `${footnote.replace(/\n+$/, '')} <a href="#footnote-ref-${i + 1}" class="footnote-return">⤴</a>`,
            ).trim()}</li>`,
        )
        .join('')}</ol>`;
    }

    chunk.contents = Buffer.from(contents);
    callback(null, chunk);
  });

export const parseDate = () =>
  catchThrough((chunk, callback) => {
    const timestamp = day.tz(chunk.frontMatter.date);
    if (!timestamp.isValid()) throw new Error('Posts need a proper date!');
    chunk.frontMatter.date = timestamp;
    callback(null, chunk);
  });

// Heavily influenced by gulp-paginate

export const paginate = (perPage = 5) => {
  let posts: string[] = [];
  let pageCount = 0;

  const generatePage = (callback: Callback) => {
    const newFile = new Vinyl();
    const page = posts.join('');
    const name = pageCount === 0 ? 'index.html' : `blog/${pageCount + 1}/index.html`;

    pageCount += 1;
    newFile.contents = Buffer.from(page);
    newFile.path = path.join(name);

    posts = [];

    callback(null, newFile);
  };

  return through.obj(
    (chunk, _, callback) => {
      try {
        posts = [...posts, String(chunk.contents)];

        if (posts.length === perPage) {
          generatePage(callback);
          return;
        }

        callback();
      } catch (err) {
        callback(err);
      }
    },
    (callback) => {
      if (posts.length) {
        generatePage(callback);
        return;
      }
      callback();
    },
  );
};

export const renameSinglePost = () =>
  catchThrough((chunk, callback) => {
    chunk.path = chunk.path.replace('.html', '/index.html');

    callback(null, chunk);
  });
