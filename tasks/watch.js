/* global process, Buffer */

const path = require('path'),
  exec = require('child_process').exec,
  gulp = require('gulp'),
  log = require('fancy-log'),
  chalk = require('chalk'),
  gulpif = require('gulp-if'),
  conf = require('./conf'),
  less = require('gulp-less'),
  sass = require('gulp-sass'),
  eslint = require('gulp-eslint'),
  mt2amd = require('gulp-mt2amd'),
  rename = require('gulp-rename'),
  util = require('./util'),
  lazyTasks = require('./lazy-tasks');

// watch for changes and run the relevant task
gulp.task('watch', function () {
  process.on('uncaughtException', function (err) {
    console.log(err.stack || err.message || err);
  });

  gulp.watch(
    util.appendSrcExclusion([
      'src/*.html',
      'src/' + conf.PROJECT_NAME + '/**/*.html',
      '!src/**/*.layout.html',
      '!src/**/*.inc.html',
      '!src/**/*.tpl.html'
    ]),
    function (evt) {
      let filePath = evt.path;
      let part = (path.dirname(filePath) + '/').split('/src/').pop();
      log(chalk.cyan('[changed]'), filePath);
      return gulp
        .src(filePath)
        .pipe(lazyTasks.lazyInitHtmlTask())
        .pipe(gulp.dest('dist/' + part));
    }
  );

  gulp.watch(
    [
      'src/**/*.layout.html',
      'src/**/*.inc.html',
      'src/**/*.pr.tpl.html',
      'src/**/*.pr.md'
    ],
    function (evt) {
      let filePath = evt.path;
      log(chalk.cyan('[changed]'), filePath);
      return gulp.start('html');
    }
  );

  gulp.watch(
    util.appendSrcExclusion([
      'src/' + conf.PROJECT_NAME + '/**/*.+(json|md)',
      '!src/' + conf.PROJECT_NAME + '/**/README.md',
      '!src/' + conf.PROJECT_NAME + '/js/lang/**/*',
      '!src/' + conf.PROJECT_NAME + '/js/release-note/**/*'
    ]),
    function (evt) {
      let filePath = evt.path;
      let part = (path.dirname(filePath) + '/')
        .split('/src/' + conf.PROJECT_NAME + '/')
        .pop();
      log(chalk.cyan('[changed]'), filePath);
      return gulp
        .src(filePath)
        .pipe(mt2amd())
        .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/' + part));
    }
  );

  gulp.watch(
    util.appendSrcExclusion(['src/' + conf.PROJECT_NAME + '/**/*.+(js|jsx)']),
    function (evt) {
      let filePath = evt.path;
      let part = (path.dirname(filePath) + '/')
        .split('/src/' + conf.PROJECT_NAME + '/')
        .pop();
      log(chalk.cyan('[changed]'), filePath);
      return gulp
        .src(filePath)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(lazyTasks.babelTask())
        .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/' + part));
    }
  );

  gulp.watch(
    util.appendSrcExclusion(['src/' + conf.PROJECT_NAME + '/**/*.ts']),
    function (evt) {
      let filePath = evt.path;
      let part = (path.dirname(filePath) + '/')
        .split('/src/' + conf.PROJECT_NAME + '/')
        .pop();
      log(chalk.cyan('[changed]'), filePath);
      return gulp
        .src(filePath)
        .pipe(lazyTasks.tsTask())
        .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/' + part));
    }
  );

  gulp.watch(
    [
      'dist/' + conf.PROJECT_NAME + '/js/template/message/**/*.js',
      '!dist/' + conf.PROJECT_NAME + '/js/template/message/**/main.js'
    ],
    function (evt) {
      let filePath = evt.path;
      log(chalk.cyan('[changed]'), filePath);
      return gulp.start('bundle-message-template');
    }
  );

  gulp.watch(
    util.appendSrcExclusion(['src/' + conf.PROJECT_NAME + '/**/*.less']),
    function (evt) {
      let filePath = evt.path;
      let part = (path.dirname(filePath) + '/')
        .split('/src/' + conf.PROJECT_NAME + '/')
        .pop();
      let isComponent = (/(^|-)style\.less$/).test(path.basename(filePath));
      log(chalk.cyan('[changed]'), filePath);
      if (/(^|-)main\.less$/.test(path.basename(filePath)) || isComponent) {
        return gulp
          .src(filePath)
          .pipe(lazyTasks.stylelintTask())
          .pipe(less())
          .on('error', function (err) {
            log(chalk.red(err.message));
          })
          .pipe(lazyTasks.lazyPostcssTask())
          .on('error', function (err) {
            log(chalk.red(err.message));
          })
          .pipe(
            gulpif(
              isComponent,
              mt2amd({
                cssModuleClassNameGenerator: util.cssModuleClassNameGenerator,
                useExternalCssModuleHelper: !conf.IS_NG_PROJECT,
                ngStyle: conf.IS_NG_PROJECT
              })
            )
          )
          .pipe(
            gulpif(
              isComponent,
              rename(function (file) {
                file.basename = file.basename.replace(/\.css$/, '.less');
              })
            )
          )
          .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/' + part));
      } else {
        return gulp.start('less:main');
      }
    }
  );

  gulp.watch(
    util.appendSrcExclusion(['src/' + conf.PROJECT_NAME + '/**/*.scss']),
    function (evt) {
      let filePath = evt.path;
      let part = (path.dirname(filePath) + '/')
        .split('/src/' + conf.PROJECT_NAME + '/')
        .pop();
      let isComponent = (/(^|-)style\.scss$/).test(path.basename(filePath));
      log(chalk.cyan('[changed]'), filePath);
      if (/(^|-)main\.scss$/.test(path.basename(filePath)) || isComponent) {
        return gulp
          .src(filePath)
          .pipe(lazyTasks.stylelintTask())
          .pipe(sass())
          .on('error', function (err) {
            log(chalk.red(err.message));
          })
          .pipe(lazyTasks.lazyPostcssTask())
          .on('error', function (err) {
            log(chalk.red(err.message));
          })
          .pipe(
            gulpif(
              isComponent,
              mt2amd({
                cssModuleClassNameGenerator: util.cssModuleClassNameGenerator,
                useExternalCssModuleHelper: !conf.IS_NG_PROJECT,
                ngStyle: conf.IS_NG_PROJECT
              })
            )
          )
          .pipe(
            gulpif(
              isComponent,
              rename(function (file) {
                file.basename = file.basename.replace(/\.css$/, '.scss');
              })
            )
          )
          .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/' + part));
      } else {
        return gulp.start('sass:main');
      }
    }
  );

  gulp.watch(['src/' + conf.PROJECT_NAME + '/**/*.tpl.html'], function (evt) {
    let filePath = evt.path;
    log(chalk.cyan('[changed]'), filePath);
    return gulp.start('mt');
  });

  gulp.watch('src/' + conf.PROJECT_NAME + '/js/lang/**/*.json', function (evt) {
    let filePath = evt.path;
    log(chalk.cyan('[changed]'), filePath);
    return gulp.start('i18n:resolve-reference');
  });
});
