const grayMatter = require('gray-matter'),
      through = require('through2');

module.exports = () => through.obj((chunk, _, callback) => {
  try {
    if (chunk.isNull()) return callback(null, chunk);

    const matter = grayMatter(String(chunk.contents));
    chunk.frontMatter = matter.data || {};
    chunk.contents = new Buffer(String(matter.content).trim());

    callback(null, chunk);
  } catch (err) {
    callback(err);
  }
});
