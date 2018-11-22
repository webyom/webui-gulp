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
  mt2amd = require('gulp-mt2amd'),
  util = require('./util'),
  envify = require('gulp-envify'),
  vueify = require('gulp-vueify'),
  postcss = require('gulp-postcss'),
  postcssImport = require('postcss-import'),
  postcssCssnext = require('postcss-cssnext'),
  through = require('through2'),
  htmlI18n = require('gulp-html-i18n'),
  lesshint = require('gulp-lesshint'),
  rename = require('gulp-rename'),
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

exports.lazyLesshint = lazypipe()
  .pipe(lesshint)
  .pipe(function () {
    let count = 0;
    return through
      .obj(function (file, enc, callback) {
        if (file.lesshint && !file.lesshint.success) {
          file.lesshint.results.forEach(function (result) {
            let output = '';
            if (result.severity === 'error') {
              output += chalk.red('Error: ');
            } else {
              output += chalk.yellow('Warning: ');
            }
            output
              += chalk.cyan(path.relative(process.cwd(), file.path)) + ': ';
            if (result.line) {
              output += chalk.magenta('line ' + result.line) + ', ';
            }
            if (result.column) {
              output += chalk.magenta('col ' + result.column) + ', ';
            }
            output += chalk.green(result.linter) + ': ';
            output += result.message;
            log(output);
            count++;
          });
        }
        return callback(null, file);
      })
      .on('finish', function (x) {
        if (count) {
          throw new PluginError('gulp-lesshint', {
            name: 'LesshintError',
            message:
              'Failed with ' + count + (count === 1 ? ' error' : ' errors')
          });
        }
      });
  });

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
