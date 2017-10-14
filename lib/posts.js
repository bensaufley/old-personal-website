const moment = require('moment'),
      path = require('path'),
      through = require('through2'),
      Vinyl = require('vinyl');

const catchThrough = (func) => through.obj((chunk, _, callback) => {
  try {
    func(chunk, callback);
  } catch (err) {
    callback(err);
  }
});

const excerpt = () => catchThrough((chunk, callback) => {
  const contents = String(chunk.contents);

  if (contents.indexOf('<!--more-->') === -1) return callback(null, chunk);

  const ext = path.extname(chunk.path),
        link = chunk.path.substr(chunk.base.length, chunk.path.length - chunk.base.length - ext.length);

  chunk.contents = new Buffer(
    contents.split('<!--more-->')[0] +
      `\n\n[Read more…](/${link}/)`
  );

  callback(null, chunk);
});

const extractFootnotes = () => catchThrough((chunk, callback) => {
  let footnotes = [],
      contents = String(chunk.contents);

  if (!/\[ref\]/.test(contents)) return callback(null, chunk);

  contents = contents.replace(/\[ref\](.+?)\[\/ref\]/gmi, (_, footnote) => {
    footnotes = [...footnotes, footnote];
    return `[<sup>${footnotes.length}</sup>](#footnote-${footnotes.length})`;
  });

  contents = contents.trim() +
    '\n\n<ol class="footnotes">' +
    footnotes.map((footnote, i) => `<li id="footnote-${i + 1}">${footnote.trim()}</li>`).join('') +
    '</ol>';

  chunk.contents = new Buffer(contents);
  callback(null, chunk);
});

const parseDate = () => catchThrough((chunk, callback) => {
  const timestamp = moment(chunk.frontMatter.date);
  if (!timestamp.isValid()) throw new Error('Posts need a proper date!');
  chunk.frontMatter.date = timestamp;
  callback(null, chunk);
});

// Heavily influenced by gulp-paginate

const paginate = (perPage = 5) => {
  let posts = [],
      pageCount = 0;

  const generatePage = (callback) => {
    const newFile = new Vinyl(),
          page = posts.join(''),
          name = pageCount === 0 ? 'index.html' : `blog/${pageCount + 1}/index.html`;

    pageCount++;
    newFile.contents = new Buffer(page);
    newFile.path = path.join(name);

    posts = [];

    return callback(null, newFile);
  };

  return through.obj((chunk, _, callback) => {
    try {
      posts = [...posts, String(chunk.contents)];

      if (posts.length === perPage) return generatePage(callback);

      callback();
    } catch (err) {
      callback(err);
    }
  }, (callback) => {
    try {
      if (posts.length) return generatePage(callback);
      callback();
    } catch (err) {
      callback(err);
    }
  });
};

const renameSinglePost = () => catchThrough((chunk, callback) => {
  chunk.path = chunk.path.replace('.html', '/index.html');

  callback(null, chunk);
});

module.exports = {
  excerpt,
  extractFootnotes,
  paginate,
  parseDate,
  renameSinglePost
};
