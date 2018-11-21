/* global process, Buffer */

const path = require('path'),
  exec = require('child_process').exec,
  gulp = require('gulp'),
  log = require('fancy-log'),
  chalk = require('chalk'),
  gulpif = require('gulp-if'),
  conf = require('./conf'),
  less = require('gulp-less'),
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

  gulp.watch(['src/**/*.html', '!src/**/*.component.html'], function (evt) {
    let filePath = evt.path;
    let part = (path.dirname(filePath) + '/').split('/src/').pop();
    log(chalk.cyan('[changed]'), filePath);
    return gulp
      .src(filePath)
      .pipe(lazyTasks.lazyInitHtmlTask())
      .pipe(gulp.dest('dist/' + part));
  });

  gulp.watch(['src/' + conf.PROJECT_NAME + '/js/**/*.json'], function (evt) {
    let filePath = evt.path;
    let part = (path.dirname(filePath) + '/')
      .split('/src/' + conf.PROJECT_NAME + '/js/')
      .pop();
    log(chalk.cyan('[changed]'), filePath);
    return gulp
      .src(filePath)
      .pipe(mt2amd())
      .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js/' + part));
  });

  gulp.watch(
    [
      'src/' + conf.PROJECT_NAME + '/js/**/*.+(js|jsx)',
      '!src/' + conf.PROJECT_NAME + '/js/vendor/**/*'
    ],
    function (evt) {
      let filePath = evt.path;
      let part = (path.dirname(filePath) + '/')
        .split('/src/' + conf.PROJECT_NAME + '/js/')
        .pop();
      log(chalk.cyan('[changed]'), filePath);
      return gulp
        .src(filePath)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(lazyTasks.babelTask())
        .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js/' + part));
    }
  );

  gulp.watch(
    [
      'src/' + conf.PROJECT_NAME + '/js/**/*.ts',
      '!src/' + conf.PROJECT_NAME + '/js/vendor/**/*'
    ],
    function (evt) {
      let filePath = evt.path;
      let part = (path.dirname(filePath) + '/')
        .split('/src/' + conf.PROJECT_NAME + '/js/')
        .pop();
      log(chalk.cyan('[changed]'), filePath);
      return gulp
        .src(filePath)
        .pipe(lazyTasks.tsTask())
        .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js/' + part));
    }
  );

  gulp.watch(
    [
      'src/' + conf.PROJECT_NAME + '/js/**/*.vue',
      '!src/' + conf.PROJECT_NAME + '/js/vendor/**/*'
    ],
    function (evt) {
      let filePath = evt.path;
      let part = (path.dirname(filePath) + '/')
        .split('/src/' + conf.PROJECT_NAME + '/js/')
        .pop();
      log(chalk.cyan('[changed]'), filePath);
      return gulp
        .src(filePath)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(lazyTasks.vueifyTask())
        .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js/' + part));
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

  gulp.watch(['src/' + conf.PROJECT_NAME + '/**/*.less'], function (evt) {
    let filePath = evt.path;
    let part = (path.dirname(filePath) + '/')
      .split('/src/' + conf.PROJECT_NAME + '/')
      .pop();
    let isComponent = filePath.indexOf('/js/') > 0;
    log(chalk.cyan('[changed]'), filePath);
    if (/(^|-)main\.less$/.test(path.basename(filePath)) || isComponent) {
      return gulp
        .src(filePath)
        .pipe(lazyTasks.lazyLesshint())
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
      return gulp.start('less-main');
    }
  });

  gulp.watch(['src/' + conf.PROJECT_NAME + '/js/**/*.component.html'], function (
    evt
  ) {
    let filePath = evt.path;
    let part = (path.dirname(filePath) + '/')
      .split('/src/' + conf.PROJECT_NAME + '/js/')
      .pop();
    log(chalk.cyan('[changed]'), filePath);
    return gulp
      .src(filePath)
      .pipe(mt2amd({ngTemplate: true}))
      .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js/' + part));
  });

  gulp.watch(['src/' + conf.PROJECT_NAME + '/js/**/*.tpl.xhtml'], function (
    evt
  ) {
    let filePath = evt.path;
    log(chalk.cyan('[changed]'), filePath);
    return gulp.start('mt');
  });

  gulp.watch('src/' + conf.PROJECT_NAME + '/js/lang/**/*.json', function (evt) {
    let filePath = evt.path;
    log(chalk.cyan('[changed]'), filePath);
    return gulp.start('i18n-resolve-reference');
  });
});
