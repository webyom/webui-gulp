const gulp = require('gulp'),
  conf = require('./conf'),
  mt2amd = require('gulp-mt2amd'),
  cache = require('./cache'),
  util = require('./util');

// convert json, md into AMD format
gulp.task('mt:others', function () {
  return gulp
    .src(
      util.appendSrcExclusion([
        'src/' + conf.PROJECT_NAME + '/**/*.+(json|md)',
        '!src/' + conf.PROJECT_NAME + '/**/README.md',
        '!src/' + conf.PROJECT_NAME + '/js/lang/**/*',
        '!src/' + conf.PROJECT_NAME + '/js/release-note/**/*'
      ])
    )
    .pipe(mt2amd())
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

// compile micro template
gulp.task('mt:tpl', function () {
  return gulp
    .src(
      util.appendSrcExclusion(['src/' + conf.PROJECT_NAME + '/**/*.tpl.html'])
    )
    .pipe(
      cache('mt', 'src', function () {
        return mt2amd({
          strictMode: true,
          babel: util.babel
        });
      })
    )
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

// mt
gulp.task('mt', ['mt:tpl', 'mt:others']);
