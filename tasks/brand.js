const gulp = require('gulp'),
  conf = require('./conf');

gulp.task('brand-custom', ['clean-custom'], function () {
  if (!conf.BRAND_NAME) {
    throw new Error('brand-custom: BRAND_NAME must be provided!');
  }
  return gulp
    .src(['src/brand/' + conf.BRAND_NAME + '/**/_custom/**/*'], {
      base: 'src/brand/' + conf.BRAND_NAME
    })
    .pipe(gulp.dest('src/' + conf.PROJECT_NAME));
});
