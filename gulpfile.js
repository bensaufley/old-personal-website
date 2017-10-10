const autoprefixer = require('gulp-autoprefixer'),
      babel = require('gulp-babel'),
      cleanCss = require('gulp-clean-css'),
      clean = require('gulp-clean'),
      debug = require('gulp-debug'),
      { sync: globSync } = require('glob'),
      fs = require('fs'),
      gulp = require('gulp'),
      gulpIf = require('gulp-if'),
      yaml = require('js-yaml'),
      layout = require('gulp-layout'),
      livereload = require('gulp-livereload'),
      markdown = require('gulp-markdown'),
      merge = require('merge-stream'),
      path = require('path'),
      prompt = require('gulp-prompt'),
      pug = require('gulp-pug'),
      rename = require('gulp-rename'),
      rsync = require('gulp-rsync'),
      runSequence = require('run-sequence'),
      sass = require('gulp-sass'),
      sourceMaps = require('gulp-sourcemaps'),
      uglify = require('gulp-uglify');

const config = require('./config'),
      posts = require('./lib/posts'),
      throughGrayMatter = require('./lib/through-gray-matter');

const createErrorHandler = () => (err) => {
        console.error('Error in compress task', err.toString(), err.stack);
      },
      customPump = (pipes) => pipes.reduce((obj, fn) => obj.pipe(fn).on('error', createErrorHandler()));

const cleanSets = {
        pages: [
          `${config.distDirectory}/*`,
          `!${config.distDirectory}/index.html`,
          `!${config.distDirectory}/{blog,styles,scripts,images}/`
        ],
        posts: [
          `${config.distDirectory}/blog/`,
          `${config.distDirectory}/index.html`
        ],
        styles: `${config.distDirectory}/styles`,
        scripts: `${config.distDirectory}/scripts`,
        images: `${config.distDirectory}/images`
      },
      isType = (ext) => (file) => path.extname(file.relative) === ext,
      viewStream = () => ([
        throughGrayMatter(),
        gulpIf(isType('.md'), markdown()),
        gulpIf(isType('.pug'), pug())
      ]);

Error.stackTraceLimit = Infinity;

Object.keys(cleanSets).forEach((setName) => {
  gulp.task(`clean-${setName}`, () => {
    return customPump([
      gulp.src(cleanSets[setName]),
      clean()
    ]);
  });
});

gulp.task('clean', () => {
  return customPump([
    gulp.src(`${config.distDirectory}/*`),
    clean()
  ]);
});

gulp.task('pages', ['clean-pages'], () => {
  return customPump([
    gulp.src('source/pages/**/*.*'),
    debug({ title: 'pages' }),
    ...viewStream(),
    layout(({ frontMatter: data = {} }) => ({ data, layout: `source/layouts/${data.layout || config.defaultLayout}.pug` })),
    rename((file) => {
      file.dirname = file.basename;
      file.basename = 'index';
    }),
    gulp.dest(config.distDirectory),
    livereload()
  ]);
});

gulp.task('individual-posts', ['clean-posts'], () => {
  return customPump([
    gulp.src('source/posts/**/*.*'),
    debug({ title: 'posts.show' }),
    ...viewStream(),
    posts.parseDate(),
    layout(({ frontMatter: data = {} }) => ({ data, layout: 'source/layouts/blog-post.pug' })),
    posts.renameSinglePost(),
    gulp.dest(`${config.distDirectory}/blog`),
    livereload()
  ]);
});

gulp.task('posts', ['clean-posts', 'individual-posts'], () => {
  const perPage = 5,
        pageCount = Math.ceil(globSync('dist/blog/[0-9][0-9][0-9][0-9]/[0-9][0-9]/[0-9][0-9]/*').length / perPage);

  return customPump([
    gulp.src('source/posts/**/*.*'),
    debug({ title: 'posts.index' }),
    posts.excerpt(),
    ...viewStream(),
    posts.parseDate(),
    layout((file) => {
      const data = file.frontMatter,
            ext = path.extname(file.path),
            link = file.path.substr(file.base.length, file.path.length - file.base.length - ext.length);
      return { data: { ...data, link: `/blog/${link}/` }, layout: 'source/layouts/blog-listing.pug' };
    }),
    posts.paginate(perPage),
    debug({ title: 'posts.paginated' }),
    layout((file) => {
      const currentPage = file.path.split('/')[0] === 'index.html' ? 1 : Number(file.path.split('/')[1]);
      return { data: { title: 'Blog', pageCount, currentPage }, layout: 'source/layouts/blog-index.pug' };
    }),
    gulp.dest(config.distDirectory),
    livereload()
  ]);
});

gulp.task('html', ['pages', 'posts']);

gulp.task('styles', ['clean-styles'], () => {
  return customPump([
    gulp.src([
      'source/assets/styles/**/*.scss',
      '!source/assets/styles/**/_*.scss'
    ]),
    gulpIf(process.env.NODE_ENV === 'development', sourceMaps.init()),
    sass(),
    autoprefixer({
      grid: true,
      remove: false
    }),
    cleanCss(),
    gulpIf(process.env.NODE_ENV === 'development', sourceMaps.write()),
    gulp.dest(`${config.distDirectory}/styles`),
    livereload()
  ]);
});

gulp.task('scripts', ['clean-scripts'], () => {
  return customPump([
    gulp.src('source/assets/scripts/**/*.js'),
    gulpIf(process.env.NODE_ENV === 'development', sourceMaps.init()),
    babel(),
    uglify(),
    gulpIf(process.env.NODE_ENV === 'development', sourceMaps.write()),
    gulp.dest(`${config.distDirectory}/scripts`),
    livereload()
  ]);
});

gulp.task('images', ['clean-images'], () => {
  return customPump([
    gulp.src('source/assets/images/**/*'),
    gulp.dest(`${config.distDirectory}/images`),
    livereload()
  ]);
});

gulp.task('assets', ['styles', 'scripts', 'images']);

gulp.task('scraps', () => {
  return customPump([
    gulp.src([
      'source/.htaccess',
      'source/favicon.ico'
    ]),
    gulp.dest(config.distDirectory),
    livereload()
  ]);
});

gulp.task('compile', (cb) => {
  return runSequence(
    'clean',
    ['assets', 'html', 'scraps'],
    cb
  );
});

gulp.task('watch', ['compile'], () => {
  livereload.listen();

  gulp.watch('source/assets/styles/**/*.scss', ['styles']);
  gulp.watch('source/assets/scripts/**/*.js', ['scripts']);
  gulp.watch('source/assets/images/**/*', ['images']);
  gulp.watch('source/layouts/**/*', ['html']);
  gulp.watch('source/pages/**/*', ['pages']);
  gulp.watch('source/posts/**/*', ['posts']);
});

gulp.task('deploy', ['compile'], () => {
  if (process.env.NODE_ENV !== 'production') throw new Error('Only deploy Production code.');

  const ftpCreds = yaml.safeLoad(fs.readFileSync('./.sftp.yml', 'utf-8'));

  return customPump([
    gulp.src(`${config.distDirectory}/**`),
    prompt.confirm({
      message: 'Are you SURE you want to deploy to production?',
      default: false
    }),
    rsync({
      progress: true,
      incremental: true,
      emptyDirectories: true,
      recursive: true,
      clean: true,
      root: config.distDirectory,
      ...ftpCreds
    })
  ]);

});

gulp.task('default', ['compile']);
