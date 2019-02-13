const gulp = require('gulp'),
  conf = require('./conf'),
  del = require('del');

gulp.task('clean', ['clean-custom'], function () {
  return del(['dist/']);
});

gulp.task('clean-custom', function () {
  return del(['src/' + conf.PROJECT_NAME + '/**/_custom/']);
});

gulp.task('clean-cache', function () {
  return del(conf.CACHE_DIR_NAME);
});

gulp.task('clean-bundle', function () {
  return del(['dist/**/__tests__/']);
});
