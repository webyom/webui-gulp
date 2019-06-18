const fs = require('fs'),
  path = require('path'),
  gulp = require('gulp'),
  conf = require('./conf'),
  util = require('./util'),
  through = require('through2'),
  lazyTasks = require('./lazy-tasks');

gulp.task('sw', ['revision'], function () {
  return gulp
    .src('src/sw.js', {base: 'src'})
    .pipe(
      through.obj(function (file, enc, next) {
        const self = this;
        const deps = [];
        gulp
          .src(
            [
              'dist/' + conf.PROJECT_NAME + '/css/page/**/*.css',
              'dist/' + conf.PROJECT_NAME + '/js/page/**/*.js'
            ],
            {base: 'dist'}
          )
          .pipe(
            through.obj(function (file, enc, next) {
              deps.push(
                '%{{cdnBase}}%/'
                  + path.relative('dist', file.path)
                  + '?v='
                  + util.getDigest(file.contents.toString())
              );
              this.push(file);
              next();
            })
          )
          .on('finish', function () {
            const revision = util.getRevision();
            const content = file.contents
              .toString()
              .replace(/\{\{revision\}\}/g, revision)
              .replace(/\{\{deps\}\}/g, deps.join('\', \''));
            file.contents = new Buffer(content);
            self.push(file);
            next();
          })
          .on('error', function (err) {
            next(err);
          });
      })
    )
    .pipe(lazyTasks.babelTask())
    .pipe(gulp.dest('dist'));
});
