const path = require('path'),
  gulp = require('gulp'),
  conf = require('./conf'),
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
    .src(['dist/' + conf.BASE_PROJECT_NAME + '/css/vendor/**/*.css'])
    .pipe(
      digestVersioning({
        digestLength: conf.VERSION_DIGEST_LEN,
        basePath: 'dist',
        fixUrl: fixUrl
      })
    )
    .pipe(gulp.dest('dist/' + conf.BASE_PROJECT_NAME + '/css/vendor'));
});

gulp.task('versioning:app-css', function () {
  return gulp
    .src([
      'dist/' + conf.PROJECT_NAME + '/css/**/*.css',
      '!dist/' + conf.PROJECT_NAME + '/css/vendor/**/*.css'
    ])
    .pipe(
      digestVersioning({
        digestLength: conf.VERSION_DIGEST_LEN,
        basePath: 'dist',
        fixUrl: fixUrl
      })
    )
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/css'));
});

gulp.task('versioning:template', function () {
  return gulp
    .src([
      'dist/' + conf.PROJECT_NAME + '/js/**/*.css.js',
      '!dist/' + conf.PROJECT_NAME + '/js/vendor/**/*.css.js'
    ])
    .pipe(
      digestVersioning({
        digestLength: conf.VERSION_DIGEST_LEN,
        basePath: 'dist',
        fixUrl: fixUrl
      })
    )
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js'));
});

gulp.task(
  'versioning:asset',
  conf.IS_BASE_PROJECT
    ? ['versioning:app-css', 'versioning:template']
    : ['versioning:vendor-css', 'versioning:app-css', 'versioning:template']
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
