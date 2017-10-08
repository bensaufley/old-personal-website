const autoprefixer = require('gulp-autoprefixer'),
      babel = require('gulp-babel'),
      cleanCss = require('gulp-clean-css'),
      clean = require('gulp-clean'),
      gulp = require('gulp'),
      gulpif = require('gulp-if'),
      layout = require('gulp-layout'),
      livereload = require('gulp-livereload'),
      markdown = require('gulp-markdown'),
      path = require('path'),
      pug = require('gulp-pug'),
      pump = require('pump'),
      rename = require('gulp-rename'),
      through = require('through2'),
      sass = require('gulp-sass'),
      sourceMaps = require('gulp-sourcemaps'),
      uglify = require('gulp-uglify');

const config = require('./config'),
      pPump = require('./lib/promised-pump'),
      throughGrayMatter = require('./lib/through-gray-matter');

const isType = (ext) => (file) => path.extname(file.relative) === ext,
      slugify = (title) => {
        return title
          .trim()
          .toLowerCase()
          .replace(/('’)/g, '')
          .replace(/[^a-z0-9]+/gi, '-')
          .replace(/(^-|-$)/g, '');
      },
      viewStream = [
        throughGrayMatter,
        gulpif(isType('.md'), markdown()),
        gulpif(isType('.pug'), pug()),
        layout(({ frontMatter: data = {} }) => ({ data, layout: `source/layouts/${data.layout || config.defaultLayout}.pug` }))
      ];

gulp.task('clean-pages', () => {
  return gulp.src([
    `${config.distDirectory}/*`,
    `!${config.distDirectory}/*([0-9])/**/*`,
    `!${config.distDirectory}/index.html`,
    `!${config.distDirectory}/styles`,
    `!${config.distDirectory}/scripts`,
    `!${config.distDirectory}/images`
  ])
    .pipe(clean());
});

gulp.task('pages', ['clean-pages'], () => {
  return pPump([
    gulp.src('source/pages/**/*'),
    ...viewStream,
    rename((file) => {
      file.dirname = file.basename;
      file.basename = 'index';
    }),
    gulp.dest(config.distDirectory)
  ]);
});

gulp.task('posts', () => {
  const posts = {};

  return pPump([
    gulp.src('source/posts/**/*'),
    ...viewStream,
    through((file, _, callback) => {
      if (!file.frontMatter.date) throw new Error('Posts need a date!');
      const [year, month, day] = file.frontMatter.split('-').map((n) => n.length === 4 ? n : `0${n}`.substr(-2)),
            slug = slugify(file.frontMatter.title);
      [year, month, day].reduce((obj, n) => { obj[n] = obj[n] || {}; }, posts);
      file.slug = slug;
      file.date = { year, month, day };
      posts[year][month][day][slug] = true;

      callback(null, file);
    }),
    rename((file) => {
      const { year, month, day } = file.date;
      file.dirname = `blog/${year}/${month}/${day}/${file.slug}`;
      file.basename = 'index';
    }),
    gulp.dest(config.distDirectory)
  ]);
});

gulp.task('html', ['pages', 'posts']);

gulp.task('styles', () => {
  return pPump([
    gulp.src([
      'source/assets/styles/**/*.scss',
      '!source/assets/styles/**/_*.scss'
    ]),
    gulpif(process.env.NODE_ENV === 'development', sourceMaps.init()),
    sass(),
    autoprefixer(),
    cleanCss(),
    gulpif(process.env.NODE_ENV === 'development', sourceMaps.write()),
    gulp.dest(`${config.distDirectory}/styles`),
    livereload()
  ]);
});

gulp.task('scripts', () => {
  return pPump([
    gulp.src('source/assets/scripts/**/*.js'),
    gulpif(process.env.NODE_ENV === 'development', sourceMaps.init()),
    babel(),
    uglify(),
    gulpif(process.env.NODE_ENV === 'development', sourceMaps.write()),
    gulp.dest(`${config.distDirectory}/scripts`),
    livereload()
  ].filter(Boolean));
});

gulp.task('images', () => {
  return pPump([
    gulp.src('source/assets/images/**/*'),
    gulp.dest(`${config.distDirectory}/images`),
    livereload()
  ]);
});

gulp.task('assets', ['styles', 'scripts', 'images']);

gulp.task('compile', ['assets', 'html']);

gulp.task('watch', ['compile'], () => {
  livereload.listen();

  gulp.watch('source/assets/styles/**/*.sass', ['styles']);
  gulp.watch('source/assets/scripts/**/*.js', ['scripts']);
  gulp.watch('source/assets/images/**/*', ['images']);
  gulp.watch('source/layouts/**/*', ['html']);
  gulp.watch('source/pages/**/*', ['pages']);
  gulp.watch('source/posts/**/*', ['posts']);
});

gulp.task('default', ['compile']);
