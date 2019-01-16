const fs = require('fs'),
  path = require('path'),
  gulp = require('gulp'),
  log = require('fancy-log'),
  chalk = require('chalk'),
  Vinyl = require('vinyl'),
  through = require('through2'),
  mime = require('mime'),
  ALY = require('aliyun-sdk'),
  util = require('./util'),
  cache = require('./cache'),
  conf = require('./conf');

mime.default_type = 'text/plain';

const ossConfig = conf.oss || {};
let failList = [];
let retryTimes = 0;

gulp.task('deploy-oss', function (done) {
  if (!ossConfig.bucket) {
    throw new Error('deploy-oss: bucket undefined!');
  }
  let src = (failList.length > 0 && failList) || ['dist/**/*'];
  failList = [];
  let count = 0;
  gulp
    .src(src, {base: 'dist'})
    .pipe(
      through.obj(function (file, enc, next) {
        if (!file.isBuffer()) {
          next();
          return;
        }
        let uploadPath = path.relative(file.base, file.path);
        let digest = util.getDigest(file.contents);
        let cachePath
          = path.resolve(
            cache.getDefaultCacheBase(),
            path.relative(path.resolve('dist'), file.path)
          ) + '.oss';
        if (
          fs.existsSync(cachePath)
          && fs.readFileSync(cachePath).toString() == digest
        ) {
          log(chalk.blue('cache'), ++count, uploadPath);
          next();
          return;
        }
        let oss = new ALY.OSS({
          accessKeyId: process.env.OSS_ACCESS_KEY_ID,
          secretAccessKey: process.env.OSS_ACCESS_KEY_SECRET,
          endpoint: ossConfig.endpoint || 'http://oss-cn-shenzhen.aliyuncs.com',
          apiVersion: '2013-10-15'
        });
        let headers = {
          Body: file.contents,
          Bucket: ossConfig.bucket,
          Key: uploadPath,
          ContentType: mime.lookup(uploadPath),
          CacheControl: 'max-age=' + 3600 * 1
        };
        oss.putObject(headers, function (err, data) {
          if (err) {
            failList.push(file.path);
            log(chalk.red('fail'), ++count, uploadPath);
            log(err);
          } else {
            cache.wirteCacheFile(
              new Vinyl({
                base: path.resolve('dist'),
                cwd: file.cwd,
                path: file.path + '.oss',
                contents: new Buffer(digest)
              })
            );
            log(chalk.green('success'), ++count, uploadPath);
          }
          next();
        });
      })
    )
    .on('finish', function () {
      done();
      if (failList.length) {
        log(chalk.red('Deploy oss files failed:'), '\n' + failList.join('\n'));
        if (retryTimes < 3) {
          // 最多重试3次
          retryTimes++;
          log(chalk.red('Retry deploy oss time ' + retryTimes + '...'));
          gulp.start('deploy-oss');
        } else {
          log(chalk.red('Deploy oss failed!'));
        }
      }
    })
    .on('error', function (err) {
      done(err);
    });
});
