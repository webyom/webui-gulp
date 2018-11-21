const path = require('path'),
  gulp = require('gulp'),
  log = require('fancy-log'),
  chalk = require('chalk'),
  through = require('through2'),
  prettierEslint = require('prettier-eslint'),
  cache = require('./cache'),
  util = require('./util'),
  conf = require('./conf');

const ESLINT_RC_FILE = '.eslintrc.json';
const PRETTIER_RC_FILE = '.prettierrc.json';

function prettier({logFile} = {}) {
  let eslintConfig = util.safeRequireJson(ESLINT_RC_FILE);
  let prettierOptions = util.safeRequireJson(PRETTIER_RC_FILE);
  if (!eslintConfig) {
    throw new Error('gulp prettier: ' + ESLINT_RC_FILE + ' file not exist!');
  }
  return through.obj(function (file, enc, next) {
    logFile && log(chalk.blue('prettier ') + file.path);
    let content = prettierEslint({
      text: file.contents.toString(),
      eslintConfig: eslintConfig,
      prettierOptions: prettierOptions,
      fallbackPrettierOptions: {}
    });
    file.contents = new Buffer(content);
    this.push(file);
    next();
  });
}

gulp.task('prettier', function () {
  return gulp
    .src(
      util.getChangedFiles().filter(function (item) {
        return (
          item.indexOf('src/' + conf.PROJECT_NAME + '/js/' === 0)
          && (/\.(js|jsx)$/i).test(item)
        );
      }),
      {base: 'src/' + conf.PROJECT_NAME + '/js'}
    )
    .pipe(prettier({logFile: true}))
    .pipe(gulp.dest('src/' + conf.PROJECT_NAME + '/js'));
});

gulp.task('prettier-all', function () {
  return gulp
    .src(
      [
        'src/' + conf.PROJECT_NAME + '/js/**/*.+(js|jsx)',
        '!src/' + conf.PROJECT_NAME + '/js/vendor/**/*'
      ],
      {base: 'src/' + conf.PROJECT_NAME + '/js'}
    )
    .pipe(
      cache('prettier-all', 'src', prettier, {
        cacheBase: path.resolve(conf.CACHE_DIR_NAME, 'prettier'),
        targetExtName: 0
      })
    )
    .pipe(gulp.dest('src/' + conf.PROJECT_NAME + '/js'));
});

exports.prettier = prettier;
