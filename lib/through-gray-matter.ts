import grayMatter from 'gray-matter';
import through from 'through2';

// Influenced by gulp-front-matter, gulp-gray-matter

export default () =>
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
