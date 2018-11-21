const fs = require('fs'),
  path = require('path'),
  gulp = require('gulp'),
  through = require('through2'),
  conf = require('./conf'),
  marked = require('marked');

let versions = [];

gulp.task('release-note-files', function () {
  versions = [];
  return gulp
    .src('src/' + conf.PROJECT_NAME + '/js/release-note/*.md')
    .pipe(
      through.obj(function (file, enc, next) {
        let v = path.basename(file.path).replace(/\.md$/i, '');
        if (!(/[^.0-9]/).test(v)) {
          let contents = fs
            .readFileSync(file.path)
            .toString()
            .split('\n');
          let d = contents
            .shift()
            .replace(/^\s*#*\s*|\s*$/, '')
            .split(/\s+/)[0];
          versions.push([v, d]);
          file.contents = new Buffer(
            'define({content: \''
              + marked(contents.join('\n'))
                .replace(/'/g, '\\\'')
                .replace(/\n/g, '')
              + '\'});'
          );
          file.path = file.path.replace(/\.md$/i, '.js');
          this.push(file);
        }
        next();
      })
    )
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js/release-note'));
});

gulp.task('release-note-index', ['release-note-files'], function (done) {
  if (!versions.length) {
    return done();
  }
  versions = versions.sort(function (a, b) {
    a = a[0];
    b = b[0];
    a = a.split('.');
    b = b.split('.');
    let res = 0;
    let l = Math.min(a.length, b.length);
    let i, ai, bi;
    for (i = 0; i < l; i++) {
      ai = parseInt(a[i]);
      bi = parseInt(b[i]);
      if (ai > bi) {
        res = -1;
        break;
      } else if (ai < bi) {
        res = 1;
        break;
      }
    }
    if (res == 0 && a.length != b.length) {
      if (a.length > b.length) {
        res = -1;
      } else {
        res = 1;
      }
    }
    return res;
  });
  fs.writeFileSync(
    'dist/' + conf.PROJECT_NAME + '/js/release-note/index-main.js',
    'define(' + JSON.stringify(versions) + ');'
  );
  done();
});

gulp.task('release-note', ['release-note-files', 'release-note-index']);
