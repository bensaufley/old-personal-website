const grayMatter = require('gray-matter');
const through = require('through2');

// Influenced by gulp-front-matter, gulp-gray-matter

module.exports = () =>
  through.obj((chunk, _, callback) => {
    try {
      if (chunk.isNull()) {
        callback(null, chunk);
        return;
      }

      const matter = grayMatter(String(chunk.contents));
      chunk.frontMatter = matter.data || {};
      chunk.contents = Buffer.from(String(matter.content).trim());

      callback(null, chunk);
    } catch (err) {
      console.error(err);
      callback(err);
    }
  });
