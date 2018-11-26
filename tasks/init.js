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
      util.appendSrcExclusion([
        'src/' + conf.PROJECT_NAME + '/**/*.+(js|jsx|vue)'
      ]),
      {base: 'src'}
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
    stream = stream.pipe(gulp.dest('src/' + conf.PROJECT_NAME));
  }
  return stream;
});

// convert json into AMD format
gulp.task('json', function () {
  return gulp
    .src(
      util.appendSrcExclusion([
        'src/' + conf.PROJECT_NAME + '/**/*.json',
        '!src/' + conf.PROJECT_NAME + '/js/lang/**/*'
      ])
    )
    .pipe(mt2amd())
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

// babel
gulp.task('babel', ['eslint'], function () {
  return gulp
    .src(
      util.appendSrcExclusion(['src/' + conf.PROJECT_NAME + '/**/*.+(js|jsx)'])
    )
    .pipe(cache('babel', 'src', lazyTasks.babelTask))
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

// ts
gulp.task('ts', function () {
  return gulp
    .src(util.appendSrcExclusion(['src/' + conf.PROJECT_NAME + '/**/*.ts']))
    .pipe(cache('ts', 'src', lazyTasks.tsTask))
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

// vueify
gulp.task('vueify', ['eslint'], function () {
  return gulp
    .src(util.appendSrcExclusion(['src/' + conf.PROJECT_NAME + '/**/*.vue']))
    .pipe(cache('vueify', 'src', lazyTasks.vueifyTask))
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

// move html
gulp.task('html', function () {
  return gulp
    .src(
      util.appendSrcExclusion([
        'src/*.html',
        'src/' + conf.PROJECT_NAME + '/**/*.html',
        '!src/**/*.layout.html',
        '!src/**/*.inc.html',
        '!src/**/*.tpl.html'
      ]),
      {base: 'src'}
    )
    .pipe(lazyTasks.lazyInitHtmlTask())
    .pipe(gulp.dest('dist'));
});

// stylelint
gulp.task('stylelint', function () {
  return gulp
    .src(
      util.appendSrcExclusion([
        'src/' + conf.PROJECT_NAME + '/**/*.+(less|scss)'
      ])
    )
    .pipe(
      cache('stylelint', 'src', lazyTasks.stylelintTask, {writeCache: false})
    );
});

// compile less
gulp.task('less', ['less:main', 'less:component']);

// compile main less
gulp.task('less:main', ['stylelint'], function (done) {
  return gulp
    .src(
      util.appendSrcExclusion([
        'src/' + conf.PROJECT_NAME + '/**/*-main.less',
        'src/' + conf.PROJECT_NAME + '/**/main.less'
      ])
    )
    .pipe(less())
    .on('error', function (err) {
      done(err);
    })
    .pipe(lazyTasks.lazyPostcssTask())
    .on('error', function (err) {
      done(err);
    })
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

// compile component less
gulp.task('less:component', ['stylelint'], function (done) {
  return gulp
    .src(
      util.appendSrcExclusion([
        'src/' + conf.PROJECT_NAME + '/**/*-style.less',
        'src/' + conf.PROJECT_NAME + '/**/style.less'
      ])
    )
    .pipe(cache('less:component', 'src', lazyTasks.lessComponentTask))
    .on('error', function (err) {
      done(err);
    })
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

// compile sass
gulp.task('sass', ['sass:main', 'sass:component']);

// compile main sass
gulp.task('sass:main', ['stylelint'], function (done) {
  return gulp
    .src(
      util.appendSrcExclusion([
        'src/' + conf.PROJECT_NAME + '/**/*-main.scss',
        'src/' + conf.PROJECT_NAME + '/**/main.scss'
      ])
    )
    .pipe(sass())
    .on('error', function (err) {
      done(err);
    })
    .pipe(lazyTasks.lazyPostcssTask())
    .on('error', function (err) {
      done(err);
    })
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

// compile component sass
gulp.task('sass:component', ['stylelint'], function (done) {
  return gulp
    .src(
      util.appendSrcExclusion([
        'src/' + conf.PROJECT_NAME + '/**/*-style.scss',
        'src/' + conf.PROJECT_NAME + '/**/style.scss'
      ])
    )
    .pipe(cache('scss:component', 'src', lazyTasks.sassComponentTask))
    .on('error', function (err) {
      done(err);
    })
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

// compile micro template
gulp.task('mt', function () {
  return gulp
    .src(
      util.appendSrcExclusion(['src/' + conf.PROJECT_NAME + '/**/*.tpl.html'])
    )
    .pipe(
      cache('mt', 'src', function () {
        return mt2amd();
      })
    )
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

// move img
gulp.task('img', function () {
  return gulp
    .src(
      util.appendSrcExclusion([
        'src/'
          + conf.PROJECT_NAME
          + '/**/*.+(jpg|jpeg|gif|png|otf|eot|svg|ttf|woff|woff2|ico|mp3|swf|md)'
      ]),
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
