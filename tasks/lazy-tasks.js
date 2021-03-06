/* global Buffer */

const path = require('path'),
  log = require('fancy-log'),
  chalk = require('chalk'),
  PluginError = require('plugin-error'),
  conf = require('./conf'),
  lazypipe = require('lazypipe'),
  eslint = require('gulp-eslint'),
  babel = require('gulp-babel'),
  less = require('gulp-less'),
  sass = require('gulp-sass'),
  mt2amd = require('gulp-mt2amd'),
  util = require('./util'),
  envify = require('gulp-envify'),
  postcss = require('gulp-postcss'),
  postcssImport = require('postcss-import'),
  postcssPresetEnv = require('postcss-preset-env'),
  through = require('through2'),
  htmlI18n = require('gulp-html-i18n'),
  stylelint = require('gulp-stylelint'),
  rename = require('gulp-rename'),
  htmlOptimizer = require('gulp-html-optimizer'),
  propertyMerge = require('gulp-property-merge');

const EOL = '\n';

// lazy tasks

exports.propertyMergeTask = lazypipe().pipe(
  propertyMerge,
  {
    properties: Object.assign({}, conf)
  }
);

exports.lazyAmdWrapTask = lazypipe().pipe(function () {
  return through.obj(function (file, enc, callback) {
    let contents = file.contents.toString();
    if (
      /\bexports\.|\bmodule.exports\b|Object.defineProperty\(exports,/.test(
        contents
      )
    ) {
      file.contents = new Buffer(
        [
          'define(function (require, exports, module) {',
          file.contents.toString(),
          '});'
        ].join(EOL)
      );
    }
    this.push(file);
    callback();
  });
});

exports.lazyPostcssTask = lazypipe().pipe(
  postcss,
  [
    postcssImport(),
    postcssPresetEnv()
  ]
);

exports.lazyHtmlI18nTask = function (runId) {
  return lazypipe().pipe(
    htmlI18n,
    {
      runId: runId,
      createLangDirs: true,
      langDir: 'src/' + conf.PROJECT_NAME + '/js/lang',
      defaultLang: conf.defaultLang
    }
  );
};

exports.lazyInitHtmlTask = function () {
  const runId = Math.random();

  return lazypipe()
    .pipe(
      propertyMerge,
      {
        properties: Object.assign({}, conf)
      }
    )
    .pipe(exports.lazyHtmlI18nTask(runId))
    .pipe(htmlI18n.restorePath)
    .pipe(
      htmlOptimizer,
      {
        baseDir: 'dist',
        optimizeRequire: 'ifAlways',
        cacheExtend: false,
        strictModeTemplate: true,
        babel: util.babel
      }
    )
    .pipe(exports.lazyHtmlI18nTask(runId))
    .pipe(
      propertyMerge,
      {
        properties: Object.assign(
          {
            md5map: '{}'
          },
          conf
        )
      }
    )
    .pipe(htmlI18n.i18nPath);
};

exports.stylelintTask = lazypipe().pipe(
  stylelint,
  {
    fix: conf.STYLELINT_FIX,
    failAfterError: false,
    reporters: [{formatter: 'string', console: true}]
  }
);

exports.eslintTask = lazypipe()
  .pipe(
    eslint,
    {fix: conf.ESLINT_FIX}
  )
  .pipe(eslint.format);

exports.babelTask = lazypipe()
  .pipe(exports.propertyMergeTask)
  .pipe(babel)
  .pipe(
    envify,
    {NODE_ENV: conf.ENV}
  )
  .pipe(exports.lazyAmdWrapTask);

exports.lessComponentTask = lazypipe()
  .pipe(less)
  .pipe(exports.lazyPostcssTask)
  .pipe(
    mt2amd,
    {
      cssModuleClassNameGenerator: util.cssModuleClassNameGenerator,
      useExternalCssModuleHelper: true
    }
  )
  .pipe(
    rename,
    function (file) {
      file.basename = file.basename.replace(/\.css$/, '.less');
    }
  );

exports.sassComponentTask = lazypipe()
  .pipe(sass)
  .pipe(exports.lazyPostcssTask)
  .pipe(
    mt2amd,
    {
      cssModuleClassNameGenerator: util.cssModuleClassNameGenerator,
      useExternalCssModuleHelper: true
    }
  )
  .pipe(
    rename,
    function (file) {
      file.basename = file.basename.replace(/\.css$/, '.scss');
    }
  );
