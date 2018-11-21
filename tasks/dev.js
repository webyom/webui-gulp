/* global process */

const gulp = require('gulp'),
  babel = require('gulp-babel'),
  conf = require('./conf'),
  util = require('./util'),
  lazyTasks = require('./lazy-tasks'),
  amdBundler = require('gulp-amd-bundler'),
  liveServer = require('live-server'),
  karma = require('karma');

// babel message template
gulp.task('pre-bundle-message-template', function () {
  return gulp
    .src([
      'src/' + conf.PROJECT_NAME + '/js/template/message/**/main.+(js|jsx)'
    ])
    .pipe(lazyTasks.propertyMergeTask())
    .pipe(babel())
    .pipe(lazyTasks.lazyAmdWrapTask())
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js/template/message'));
});

// bundle message template
gulp.task(
  'bundle-message-template',
  ['pre-bundle-message-template'],
  function () {
    return gulp
      .src('dist/' + conf.PROJECT_NAME + '/js/template/message/**/main.js')
      .pipe(
        amdBundler({
          isRelativeDependency: util.isRelativeDependency
        })
      )
      .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js/template/message/'));
  }
);

gulp.task('serve', function (done) {
  const params = {
    port: process.env.DEV_PORT || 3007, // Set the server port. Defaults to 8080.
    host: '0.0.0.0', // Set the address to bind to. Defaults to 0.0.0.0.
    root: 'dist', // Set root directory that's being server. Defaults to cwd.
    open: true, // When false, it won't load your browser by default.
    file: 'index.html', // When set, serve this file for every 404 (useful for single-page applications)
    wait: 1000 // Waits for all changes, before reloading. Defaults to 0 sec.
  };
  liveServer.start(params);
  if (process.env.RUN_TEST == '1') {
    new karma.Server({
      configFile: process.cwd() + '/karma.conf.js',
      singleRun: false,
      reporters: ['mocha'],
      preprocessors: null
    }).start();
  }
  done();
});
