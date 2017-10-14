const moment = require('moment'),
      path = require('path'),
      through = require('through2'),
      Vinyl = require('vinyl');


const excerpt = () => through.obj((chunk, _, callback) => {
  try {
    const contents = String(chunk.contents);

    if (contents.indexOf('<!--more-->') === -1) return callback(null, chunk);

    const ext = path.extname(chunk.path),
          link = chunk.path.substr(chunk.base.length, chunk.path.length - chunk.base.length - ext.length);

    chunk.contents = new Buffer(
      contents.split('<!--more-->')[0] +
        `\n\n[Read more…](/${link}/)`
    );

    callback(null, chunk);
  } catch (err) {
    callback(err);
  }
});

const parseDate = () => through.obj((chunk, _, callback) => {
  try {
    const timestamp = moment(chunk.frontMatter.date);
    if (!timestamp.isValid()) throw new Error('Posts need a proper date!');
    chunk.frontMatter.date = timestamp;
    callback(null, chunk);
  } catch (err) {
    callback(err);
  }
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

const renameSinglePost = () => through.obj((chunk, _, callback) => {
  try {
    chunk.path = chunk.path.replace('.html', '/index.html');

    callback(null, chunk);
  } catch (err) {
    callback(err);
  }
});

module.exports = {
  excerpt,
  paginate,
  parseDate,
  renameSinglePost
};
