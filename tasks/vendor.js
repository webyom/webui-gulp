const gulp = require('gulp'),
  conf = require('./conf');

gulp.task('vendor', function (done) {
  return gulp
    .src([
      'src/' + conf.PROJECT_NAME + '/**/_vendor/**/**',
      '!src/**/*.+(less|scss)'
    ])
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});
