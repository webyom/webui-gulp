/* global process */

const _ = require('lodash'),
  fs = require('fs'),
  gulp = require('gulp'),
  conf = require('./conf'),
  util = require('./util'),
  through = require('through2'),
  useref = require('gulp-useref'),
  userefCostomBlocks = require('./useref-custom-blocks'),
  lazyTasks = require('./lazy-tasks'),
  amdBundler = require('gulp-amd-bundler'),
  htmlI18n = require('gulp-html-i18n'),
  htmlOptimizer = require('gulp-html-optimizer'),
  propertyMerge = require('gulp-property-merge');

const md5map = {};

// bundle
gulp.task('bundle', ['bundle-amd', 'bundle-html']);

// bundle amd modules
gulp.task('bundle-amd', ['optimize-html'], function () {
  return gulp
    .src([
      'dist/' + conf.PROJECT_NAME + '/js/**/*-main.js',
      'dist/' + conf.PROJECT_NAME + '/js/**/main.js',
      '!dist/' + conf.PROJECT_NAME + '/js/vendor/**/main.js'
    ])
    .pipe(
      amdBundler({
        isRelativeDependency: util.isRelativeDependency
      })
    )
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME + '/js'));
});

// generate md5map for async loaded js
gulp.task('gen-md5map', ['bundle-amd'], function (done) {
  gulp
    .src([
      'dist/' + conf.BASE_PROJECT_NAME + '/js/**/*-main.+(js|json.js)',
      'dist/' + conf.BASE_PROJECT_NAME + '/js/**/main.+(js|json.js)',
      'dist/' + conf.BASE_PROJECT_NAME + '/js/vendor/**/*.js',
      'dist/' + conf.BASE_PROJECT_NAME + '/js/lang/**/*.js',
      'dist/' + conf.PROJECT_NAME + '/js/**/*-main.+(js|json.js)',
      'dist/' + conf.PROJECT_NAME + '/js/**/main.+(js|json.js)',
      'dist/' + conf.PROJECT_NAME + '/js/vendor/**/*.js',
      'dist/' + conf.PROJECT_NAME + '/js/lang/**/*.js'
    ])
    .pipe(
      through.obj(function (file, enc, next) {
        if (fs.statSync(file.path).isDirectory()) {
          next();
          return;
        }
        md5map[
          file.path.split('/' + conf.PROJECT_NAME + '/dist/')[1]
        ] = util.getDigest(fs.readFileSync(file.path));
        next();
      })
    )
    .on('finish', function () {
      const subMap = {};
      Object.keys(md5map)
        .filter(function (item) {
          return item.indexOf(conf.BASE_PROJECT_NAME + '/') !== 0;
        })
        .forEach(function (key) {
          subMap[key] = md5map[key];
        });
      fs.writeFileSync(
        'dist/' + conf.PROJECT_NAME + '/js/amd-v-map.js',
        new Buffer('define(' + JSON.stringify(subMap) + ');')
      );
      done();
    });
});

gulp.task('copy-html', function () {
  return gulp
    .src(['src/**/*.html', '!src/**/*.component.html'])
    .pipe(gulp.dest('dist'));
});

// optimize html
gulp.task('optimize-html', ['copy-html'], function () {
  return gulp
    .src(['dist/**/*.html', '!dist/**/*.component.html'])
    .pipe(lazyTasks.lazyHtmlI18nTask())
    .pipe(htmlI18n.restorePath())
    .pipe(
      propertyMerge({
        properties: _.extend(
          {},
          {
            md5map: '%{{md5map}}%'
          },
          conf
        )
      })
    )
    .pipe(
      htmlOptimizer({
        requireBaseDir: 'dist',
        isRelativeDependency: util.isRelativeDependency
      })
    )
    .pipe(
      useref({
        searchPath: process.cwd() + '/dist',
        base: process.cwd() + '/dist',
        types: ['js', 'css', 'asyncloadcss'],
        injectcss: userefCostomBlocks.injectcss,
        asyncloadcss: userefCostomBlocks.asyncloadcss
      })
    )
    .pipe(
      through.obj(function (file, enc, next) {
        file.base = file.base.split(/\/dist(\/|$)/)[0] + '/dist';
        this.push(file);
        next();
      })
    )
    .pipe(htmlI18n.i18nPath())
    .pipe(gulp.dest('dist'));
});

// bundle html
gulp.task('bundle-html', ['optimize-html', 'gen-md5map'], function () {
  return gulp
    .src(['dist/**/*.html', '!dist/**/*.component.html'])
    .pipe(
      propertyMerge({
        properties: _.extend(
          {},
          {
            md5map: JSON.stringify(md5map)
          },
          conf
        )
      })
    )
    .pipe(gulp.dest('dist'));
});
