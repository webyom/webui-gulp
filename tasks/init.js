const exec = require('child_process').exec,
  gulp = require('gulp'),
  conf = require('./conf'),
  less = require('gulp-less'),
  sass = require('gulp-sass'),
  mt2amd = require('gulp-mt2amd'),
  cache = require('./cache'),
  through = require('through2'),
  PluginError = require('plugin-error'),
  util = require('./util'),
  lazyTasks = require('./lazy-tasks');

// eslint js
gulp.task('eslint', function () {
  let errorCount = 0;
  let stream = gulp
    .src(
      [
        'src/' + conf.PROJECT_NAME + '/js/**/*.+(js|jsx|vue)',
        '!src/' + conf.PROJECT_NAME + '/js/vendor/**/*'
      ],
      {base: 'src/js'}
    )
    .pipe(
      conf.ESLINT_FIX
        ? lazyTasks.eslintTask()
        : cache('eslint', 'src', lazyTasks.eslintTask, {writeCache: false})
    )
    .pipe(
      through.obj(function (file, enc, next) {
        if (file.eslint) {
          errorCount += file.eslint.errorCount;
        }
        this.push(file);
        next();
      })
    )
    .on('finish', function () {
      if (errorCount) {
        throw new PluginError('gulp-eslint', {
          name: 'ESLintError',
          message:
            'Failed with '
            + errorCount
            + (errorCount === 1 ? ' error' : ' errors')
        });
      }
    });
  if (conf.ESLINT_FIX) {
    stream = stream.pipe(gulp.dest('src/' + conf.PROJECT_NAME + '/js'));
  }
  return stream;
});

// convert json into AMD format
gulp.task('json', ['i18n:validate'], function () {
  return gulp
    .src([
      'src/' + conf.PROJECT_NAME + '/js/**/*.json',
      '!src/' + conf.PROJECT_NAME + '/js/lang/**/*'
    ])
    .pipe(mt2amd())
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js'));
});

// babel
gulp.task('babel', ['eslint'], function () {
  return gulp
    .src([
      'src/' + conf.PROJECT_NAME + '/js/**/*.+(js|jsx)',
      '!src/' + conf.PROJECT_NAME + '/js/vendor/**/*'
    ])
    .pipe(cache('babel', 'src', lazyTasks.babelTask))
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js'));
});

// ts
gulp.task('ts', function () {
  return gulp
    .src([
      'src/' + conf.PROJECT_NAME + '/js/**/*.ts',
      '!src/' + conf.PROJECT_NAME + '/js/vendor/**/*'
    ])
    .pipe(cache('ts', 'src', lazyTasks.tsTask))
    .pipe(gulp.dest('dist/js'));
});

// vueify
gulp.task('vueify', ['eslint'], function () {
  return gulp
    .src([
      'src/' + conf.PROJECT_NAME + '/js/**/*.vue',
      '!src/' + conf.PROJECT_NAME + '/js/vendor/**/*'
    ])
    .pipe(cache('vueify', 'src', lazyTasks.vueifyTask))
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js'));
});

// move html
gulp.task('html', function () {
  return gulp
    .src(
      [
        'src/*.html',
        'src/' + conf.PROJECT_NAME + '/**/*.html',
        '!src/**/*.layout.html',
        '!src/**/*.inc.html',
        '!src/**/*.component.html'
      ],
      {base: 'src'}
    )
    .pipe(lazyTasks.lazyInitHtmlTask())
    .pipe(gulp.dest('dist'));
});

// lesshint
gulp.task('lesshint', function () {
  return gulp
    .src([
      'src/' + conf.PROJECT_NAME + '/css/app/**/*.less',
      'src/' + conf.PROJECT_NAME + '/js/**/*.less'
    ])
    .pipe(
      cache('lesshint', 'src', lazyTasks.lazyLesshint, {writeCache: false})
    );
});

// compile less
gulp.task('less', ['less:main', 'less:component']);

// compile main less
gulp.task('less:main', ['lesshint'], function (done) {
  return gulp
    .src([
      'src/' + conf.PROJECT_NAME + '/css/**/*-main.less',
      'src/' + conf.PROJECT_NAME + '/css/**/main.less'
    ])
    .pipe(less())
    .on('error', function (err) {
      done(err);
    })
    .pipe(lazyTasks.lazyPostcssTask())
    .on('error', function (err) {
      done(err);
    })
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/css'));
});

// compile component less
gulp.task('less:component', ['lesshint'], function (done) {
  return gulp
    .src(['src/' + conf.PROJECT_NAME + '/js/**/*.less'])
    .pipe(cache('less:component', 'src', lazyTasks.lessComponentTask))
    .on('error', function (err) {
      done(err);
    })
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js'));
});

// compile sass
gulp.task('sass', ['sass:main', 'sass:component']);

// compile main sass
gulp.task('sass:main', function (done) {
  return gulp
    .src([
      'src/' + conf.PROJECT_NAME + '/css/**/*-main.scss',
      'src/' + conf.PROJECT_NAME + '/css/**/main.scss'
    ])
    .pipe(sass())
    .on('error', function (err) {
      done(err);
    })
    .pipe(lazyTasks.lazyPostcssTask())
    .on('error', function (err) {
      done(err);
    })
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/css'));
});

// compile component sass
gulp.task('sass:component', function (done) {
  return gulp
    .src(['src/' + conf.PROJECT_NAME + '/js/**/*.scss'])
    .pipe(cache('scss:component', 'src', lazyTasks.sassComponentTask))
    .on('error', function (err) {
      done(err);
    })
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js'));
});

// compile micro template
gulp.task('mt', function () {
  return gulp
    .src(['src/' + conf.PROJECT_NAME + '/js/**/*.tpl.xhtml'])
    .pipe(mt2amd())
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js'));
});

// move img
gulp.task('img', function () {
  return gulp
    .src(
      [
        'src/**/*.+(jpg|jpeg|gif|png|otf|eot|svg|ttf|woff|woff2|ico|mp3|swf|md)',
        '!src/app/**/*',
        '!src/base/**/*',
        'src/' + conf.PROJECT_NAME + '/js/vendor/**/*'
      ],
      {base: 'src'}
    )
    .pipe(gulp.dest('dist'));
});

// copy base
gulp.task('copy-base', function () {
  return gulp
    .src([
      '../' + conf.BASE_PROJECT_NAME + '/dist/**/*',
      '!../' + conf.BASE_PROJECT_NAME + '/dist/**/*.html'
    ])
    .pipe(gulp.dest('dist'));
});
