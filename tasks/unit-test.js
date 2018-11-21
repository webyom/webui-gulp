/* global process */

const gulp = require('gulp'),
  log = require('fancy-log'),
  chalk = require('chalk'),
  karma = require('karma');

gulp.task('unit-test', function (done) {
  new karma.Server(
    {
      configFile: process.cwd() + '/karma.conf.js',
      singleRun: true
    },
    function (exitCode) {
      let msg = 'Karma has exited with ' + exitCode;
      done();
      log(chalk[exitCode ? 'red' : 'green'](msg));
      process.exit(exitCode);
    }
  ).start();
});
