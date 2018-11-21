/* global process */

const _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  log = require('fancy-log'),
  chalk = require('chalk');
const defaultConfig = require('../config');

let config;
try {
  config = require('../../../config');
} catch (e) {
  config = {};
}

let env = process.env.NODE_ENV;
let conf;

(function () {
  let defaultConf;
  let envs = defaultConfig.envs || defaultConfig;
  if (!envs[env]) {
    env = 'dev';
  }
  defaultConf = envs[env];
  conf = _.extend({}, defaultConf, (config.envs || config)[env]);

  log('Running env ' + chalk.green(env));

  // overwrite config from command line
  for (let p in conf) {
    if (process.env[p]) {
      conf[p] = process.env[p];
    }
  }
})();

conf.CACHE_DIR_NAME = '.build-cache';
conf.USE_CACHE = process.env.BUILD_CACHE != '0';
conf.ESLINT_FIX = process.env.ESLINT_FIX == '1';
conf.BASE_PROJECT_NAME = config.baseProjectName || 'webui-base';
conf.PROJECT_NAME = process
  .cwd()
  .split(path.sep)
  .pop();
conf.IS_BASE_PROJECT = conf.PROJECT_NAME == conf.BASE_PROJECT_NAME;
conf.ENV = env;
conf.VERSION_DIGEST_LEN = 4;
conf.IS_PRODUCTION = env == 'production';
conf.IS_NG_PROJECT = !!config.ngProject;

let ossKey = null;
conf.getOssKey = function () {
  if (ossKey) {
    return ossKey;
  }
  let keyPath
    = (conf.oss && conf.oss.keyPath) || '/usr/local/etc/lepin/oss-key';
  if (!fs.existsSync(keyPath)) {
    throw new Error('OSS key file "' + keyPath + '" does not exist!');
  }
  let content = fs.readFileSync(keyPath).toString();
  let keys = content.split('\n')[0].split(' ');
  ossKey = {
    id: keys[0],
    secret: keys[1]
  };
  return ossKey;
};

if (
  path.join(process.cwd(), 'node_modules/webui-gulp/tasks') != __dirname
  && path.resolve(
    process.cwd(),
    '../' + conf.BASE_PROJECT_NAME + '/node_modules/webui-gulp/tasks'
  ) != __dirname
) {
  log(chalk.red('Please run gulp in the project root dir.'));
  process.exit(1);
}

module.exports = conf;
