import moment from 'moment';
import path from 'path';
import through from 'through2';
import Vinyl from 'vinyl';

export const catchThrough = (func) =>
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

    chunk.contents = Buffer.from(`${contents.split('<!--more-->')[0]}\n\n[Read more…](/${link}/)`);

    callback(null, chunk);
  });

export const extractFootnotes = () =>
  catchThrough((chunk, callback) => {
    let footnotes = [];
    let contents = String(chunk.contents);

    if (!/\[ref\]/.test(contents)) {
      callback(null, chunk);
      return;
    }

    contents = contents.replace(/\[ref\](.+?)\[\/ref\]/gim, (_, footnote) => {
      footnotes = [...footnotes, footnote];
      return `[<sup>${footnotes.length}</sup>](#footnote-${footnotes.length})`;
    });

    contents = `${contents.trim()}\n\n<ol class="footnotes">${footnotes
      .map((footnote, i) => `<li id="footnote-${i + 1}">${footnote.trim()}</li>`)
      .join('')}</ol>`;

    chunk.contents = Buffer.from(contents);
    callback(null, chunk);
  });

export const parseDate = () =>
  catchThrough((chunk, callback) => {
    const timestamp = moment(chunk.frontMatter.date);
    if (!timestamp.isValid()) throw new Error('Posts need a proper date!');
    chunk.frontMatter.date = timestamp;
    callback(null, chunk);
  });

// Heavily influenced by gulp-paginate

export const paginate = (perPage = 5) => {
  let posts = [];
  let pageCount = 0;

  const generatePage = (callback) => {
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
      try {
        if (posts.length) {
          generatePage(callback);
          return;
        }
        callback();
      } catch (err) {
        callback(err);
      }
    },
  );
};

export const renameSinglePost = () =>
  catchThrough((chunk, callback) => {
    chunk.path = chunk.path.replace('.html', '/index.html');

    callback(null, chunk);
  });
