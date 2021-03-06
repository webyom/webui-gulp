/* global process, Buffer */

const path = require('path'),
  gulp = require('gulp'),
  log = require('fancy-log'),
  chalk = require('chalk'),
  gulpif = require('gulp-if'),
  conf = require('./conf'),
  less = require('gulp-less'),
  sass = require('gulp-sass'),
  ts = require('gulp-typescript'),
  envify = require('gulp-envify'),
  eslint = require('gulp-eslint'),
  mt2amd = require('gulp-mt2amd'),
  rename = require('gulp-rename'),
  cache = require('./cache'),
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
      const filePath = evt.path;
      const part = (path.dirname(filePath) + '/').split('/src/').pop();
      log(chalk.cyan('[changed]'), filePath);
      return gulp
        .src(filePath)
        .pipe(lazyTasks.lazyInitHtmlTask()())
        .pipe(gulp.dest('dist/' + part));
    }
  );

  gulp.watch(
    [
      'src/**/*.layout.html',
      'src/**/*.inc.+(html|js|css)',
      'src/**/*.pr.tpl.html',
      'src/**/*.pr.md'
    ],
    function (evt) {
      const filePath = evt.path;
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
      const filePath = evt.path;
      const part = (path.dirname(filePath) + '/')
        .split('/src/' + conf.PROJECT_NAME + '/')
        .pop();
      log(chalk.cyan('[changed]'), filePath);
      return gulp
        .src(filePath)
        .pipe(mt2amd())
        .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/' + part));
    }
  );

  gulp.watch('src/sw.js', function (evt) {
    const filePath = evt.path;
    log(chalk.cyan('[changed]'), filePath);
    return gulp.start('sw');
  });

  gulp.watch(
    util.appendSrcExclusion(['src/' + conf.PROJECT_NAME + '/**/*.+(js|jsx)']),
    function (evt) {
      const filePath = evt.path;
      const part = (path.dirname(filePath) + '/')
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
    util.appendSrcExclusion(['src/' + conf.PROJECT_NAME + '/**/*.+(ts|tsx)']),
    function (evt) {
      const filePath = evt.path;
      const part = (path.dirname(filePath) + '/')
        .split('/src/' + conf.PROJECT_NAME + '/')
        .pop();
      log(chalk.cyan('[changed]'), filePath);
      return gulp
        .src(filePath)
        .pipe(lazyTasks.propertyMergeTask())
        .pipe(cache('ts', 'src', ts.createProject('tsconfig.json', {
          module: 'commonjs',
          moduleResolution: 'node'
        })))
        .pipe(envify({NODE_ENV: conf.ENV}))
        .pipe(lazyTasks.lazyAmdWrapTask())
        .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/' + part));
    }
  );

  gulp.watch(
    [
      'dist/' + conf.PROJECT_NAME + '/js/template/message/**/*.js',
      '!dist/' + conf.PROJECT_NAME + '/js/template/message/**/main.js'
    ],
    function (evt) {
      const filePath = evt.path;
      log(chalk.cyan('[changed]'), filePath);
      return gulp.start('bundle-message-template');
    }
  );

  gulp.watch(
    util.appendSrcExclusion(['src/' + conf.PROJECT_NAME + '/**/*.less']),
    function (evt) {
      const filePath = evt.path;
      const part = (path.dirname(filePath) + '/')
        .split('/src/' + conf.PROJECT_NAME + '/')
        .pop();
      const isComponent = (/(^|-)style\.less$/).test(path.basename(filePath));
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
                useExternalCssModuleHelper: true
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
      const filePath = evt.path;
      const part = (path.dirname(filePath) + '/')
        .split('/src/' + conf.PROJECT_NAME + '/')
        .pop();
      const isComponent = (/(^|-)style\.scss$/).test(path.basename(filePath));
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
                useExternalCssModuleHelper: true
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
    const filePath = evt.path;
    log(chalk.cyan('[changed]'), filePath);
    return gulp.start('mt');
  });

  gulp.watch('src/' + conf.PROJECT_NAME + '/js/lang/**/*.json', function (evt) {
    const filePath = evt.path;
    log(chalk.cyan('[changed]'), filePath);
    return gulp.start('i18n:resolve-reference');
  });
});
