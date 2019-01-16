/* global process */

const _ = require('underscore'),
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
  const envs = defaultConfig.envs || defaultConfig;
  if (!envs[env]) {
    env = 'local';
  }
  defaultConf = _.omit(Object.assign({}, defaultConfig, envs[env]), 'envs');
  conf = _.omit(
    Object.assign({}, defaultConf, config, (config.envs || config)[env]),
    'envs'
  );

  log('Running env ' + chalk.green(env));

  // overwrite config from command line
  for (const p in conf) {
    if (process.env[p]) {
      conf[p] = process.env[p];
    }
  }
})();

conf.CACHE_DIR_NAME = '.build-cache';
conf.USE_CACHE = process.env.BUILD_CACHE != '0';
conf.USE_HTTPS = process.env.USE_HTTPS == '1';
conf.ESLINT_FIX = process.env.ESLINT_FIX == '1';
conf.PROJECT_NAME = process
  .cwd()
  .split(path.sep)
  .pop();
conf.BASE_PROJECT_NAME
  = config.baseProjectName
  || (conf.PROJECT_NAME.indexOf('webui-m-') === 0 ? 'webui-m-base' : 'webui-base');
conf.IS_BASE_PROJECT = conf.PROJECT_NAME == conf.BASE_PROJECT_NAME;
conf.ENV = env;
conf.VERSION_DIGEST_LEN = 4;
conf.IS_PRODUCTION = env == 'production';
conf.IS_NG_PROJECT = !!config.ngProject;

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
