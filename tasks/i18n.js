const gulp = require('gulp'),
  conf = require('./conf'),
  htmlI18n = require('gulp-html-i18n'),
  mt2amd = require('gulp-mt2amd');

// resolve reference in language resource file
gulp.task('i18n:resolve-reference', function () {
  return gulp
    .src(['src/' + conf.PROJECT_NAME + '/js/lang/**/*.json'])
    .pipe(
      htmlI18n.resolveReference({
        langDir: 'src/' + conf.PROJECT_NAME + '/js/lang'
      })
    )
    .pipe(mt2amd())
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js/lang'));
});

// validate consistence between each lang version
gulp.task('i18n:validate', function () {
  return gulp.src(['src/' + conf.PROJECT_NAME + '/js/lang/**/*.json']).pipe(
    htmlI18n.validateJsonConsistence({
      langDir: 'src/' + conf.PROJECT_NAME + '/js/lang'
    })
  );
});

// sort key in lang json
// caution!!! this will overwrite the source file in src folder!!!
gulp.task('i18n:sort', ['i18n:validate'], function () {
  return gulp
    .src(['src/' + conf.PROJECT_NAME + '/js/lang/**/*.json'])
    .pipe(
      htmlI18n.jsonSortKey({
        endWithNewline: true,
        reserveOrder: function (keyStack) {
          return keyStack[1] == 'option' && keyStack.length === 3;
        }
      })
    )
    .pipe(gulp.dest('src/' + conf.PROJECT_NAME + '/js/lang'));
});
