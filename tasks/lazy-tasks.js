/* global Buffer */

const path = require('path'),
  log = require('fancy-log'),
  chalk = require('chalk'),
  PluginError = require('plugin-error'),
  conf = require('./conf'),
  lazypipe = require('lazypipe'),
  eslint = require('gulp-eslint'),
  babel = require('gulp-babel'),
  ts = require('gulp-typescript'),
  less = require('gulp-less'),
  sass = require('gulp-sass'),
  mt2amd = require('gulp-mt2amd'),
  util = require('./util'),
  envify = require('gulp-envify'),
  vueify = require('gulp-vueify'),
  postcss = require('gulp-postcss'),
  postcssImport = require('postcss-import'),
  postcssCssnext = require('postcss-cssnext'),
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
    postcssCssnext({
      browsers: ['last 4 versions', 'not ie <= 8']
    })
  ]
);

exports.lazyHtmlI18nTask = lazypipe().pipe(
  htmlI18n,
  {
    createLangDirs: true,
    langDir: 'src/' + conf.PROJECT_NAME + '/js/lang',
    defaultLang: conf.defaultLang
  }
);

exports.lazyInitHtmlTask = lazypipe()
  .pipe(
    htmlOptimizer,
    {processRequire: false, cacheExtend: false}
  )
  .pipe(
    propertyMerge,
    {
      properties: Object.assign(
        {},
        {
          md5map: '{}'
        },
        conf
      )
    }
  )
  .pipe(exports.lazyHtmlI18nTask);

exports.lazyStylelint = lazypipe().pipe(
  stylelint,
  {
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

exports.tsTask = lazypipe()
  .pipe(exports.propertyMergeTask)
  .pipe(
    ts,
    {
      isolatedModules: true,
      esModuleInterop: true,
      importHelpers: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      target: 'ES5',
      module: 'amd'
    }
  )
  .pipe(
    envify,
    {NODE_ENV: conf.ENV}
  );

exports.vueifyTask = lazypipe()
  .pipe(exports.propertyMergeTask)
  .pipe(vueify)
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
      useExternalCssModuleHelper: !conf.IS_NG_PROJECT,
      ngStyle: conf.IS_NG_PROJECT
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
      useExternalCssModuleHelper: !conf.IS_NG_PROJECT,
      ngStyle: conf.IS_NG_PROJECT
    }
  )
  .pipe(
    rename,
    function (file) {
      file.basename = file.basename.replace(/\.css$/, '.sass');
    }
  );
