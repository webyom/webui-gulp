const path = require('path'),
  gulp = require('gulp'),
  conf = require('./conf'),
  util = require('./util'),
  digestVersioning = require('gulp-digest-versioning');

function fixUrl(fileName, relPath, basePath) {
  if (!(/^\//).test(fileName)) {
    let filePath = path.resolve(path.dirname(relPath), fileName);
    fileName = '/' + path.relative(basePath, filePath);
  }
  return conf.cdnBase + fileName;
}

// digest versioning template and css
gulp.task('versioning:vendor-css', function () {
  return gulp
    .src(['dist/**/_vendor/**/*.css'], {base: 'dist'})
    .pipe(
      digestVersioning({
        digestLength: conf.VERSION_DIGEST_LEN,
        basePath: 'dist',
        fixUrl: fixUrl
      })
    )
    .pipe(gulp.dest('dist'));
});

gulp.task('versioning:app-css', function () {
  return gulp
    .src(util.appendSrcExclusion(['dist/' + conf.PROJECT_NAME + '/**/*.css']))
    .pipe(
      digestVersioning({
        digestLength: conf.VERSION_DIGEST_LEN,
        basePath: 'dist',
        fixUrl: fixUrl
      })
    )
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

gulp.task('versioning:component-css', function () {
  return gulp
    .src(
      util.appendSrcExclusion([
        'dist/' + conf.PROJECT_NAME + '/**/*.+(less.js|scss.js)'
      ])
    )
    .pipe(
      digestVersioning({
        digestLength: conf.VERSION_DIGEST_LEN,
        basePath: 'dist',
        fixUrl: fixUrl
      })
    )
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

gulp.task(
  'versioning:asset',
  conf.IS_BASE_PROJECT
    ? ['versioning:app-css', 'versioning:component-css']
    : [
      'versioning:vendor-css',
      'versioning:app-css',
      'versioning:component-css'
    ]
);

// digest versioning html page
gulp.task('versioning:page', function () {
  return gulp
    .src(['dist/**/*.html'])
    .pipe(
      digestVersioning({
        digestLength: conf.VERSION_DIGEST_LEN,
        basePath: 'dist',
        fixUrl: fixUrl
      })
    )
    .pipe(gulp.dest('dist'));
});
