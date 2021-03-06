/* global process */

const fs = require('fs'),
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
const doMinify = conf.IS_PRODUCTION && !process.env.NO_MINIFY;

// bundle
gulp.task('bundle', ['bundle:amd', 'bundle:html']);

// bundle amd modules
gulp.task('bundle:amd', ['bundle:html:optimize'], function () {
  return gulp
    .src(
      util.appendSrcExclusion([
        'dist/' + conf.PROJECT_NAME + '/**/*-main.js',
        'dist/' + conf.PROJECT_NAME + '/**/main.js'
      ])
    )
    .pipe(
      amdBundler({
        isRelativeDependency: util.isRelativeDependency
      })
    )
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

// generate md5map for async loaded js
gulp.task('bundle:gen-md5map', ['bundle:amd'], function (done) {
  gulp
    .src([
      'dist/'
        + conf.BASE_PROJECT_NAME
        + '/**/*-main.+(js|json.js|.tpl.html.js)',
      'dist/' + conf.BASE_PROJECT_NAME + '/**/main.+(js|json.js|.tpl.html.js)',
      'dist/' + conf.BASE_PROJECT_NAME + '/**/_vendor/**/*.js',
      'dist/' + conf.BASE_PROJECT_NAME + '/js/lang/**/*.js',
      'dist/' + conf.PROJECT_NAME + '/**/*-main.+(js|json.js|.tpl.html.js)',
      'dist/' + conf.PROJECT_NAME + '/**/main.+(js|json.js|.tpl.html.js)',
      'dist/' + conf.PROJECT_NAME + '/**/_vendor/**/*.js',
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

gulp.task('bundle:html:init', function () {
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
    .pipe(
      htmlOptimizer({
        baseDir: 'dist',
        minifyJS: doMinify,
        minifyCSS: doMinify,
        optimizeRequire: false
      })
    )
    .pipe(gulp.dest('dist'));
});

// optimize html
gulp.task('bundle:html:optimize', ['bundle:html:init'], function () {
  return gulp
    .src(['dist/**/*.html'])
    .pipe(lazyTasks.lazyHtmlI18nTask()())
    .pipe(htmlI18n.restorePath())
    .pipe(
      propertyMerge({
        properties: Object.assign(
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
        baseDir: 'dist',
        minifyJS: doMinify,
        minifyCSS: doMinify,
        strictModeTemplate: true,
        isRelativeDependency: util.isRelativeDependency,
        babel: util.babel
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
gulp.task(
  'bundle:html',
  ['bundle:html:optimize', 'bundle:gen-md5map'],
  function () {
    return gulp
      .src(['dist/**/*.html'])
      .pipe(
        propertyMerge({
          properties: Object.assign(
            {},
            {
              md5map: JSON.stringify(md5map).replace(/"/g, '\\"')
            },
            conf
          )
        })
      )
      .pipe(gulp.dest('dist'));
  }
);
