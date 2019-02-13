/* global process */

const _ = require('underscore'),
  fs = require('fs'),
  path = require('path'),
  log = require('fancy-log'),
  chalk = require('chalk');
const DEFAULT_CONFIG = require('../config');

const ENV = DEFAULT_CONFIG.envs[process.env.NODE_ENV]
  ? process.env.NODE_ENV
  : 'local';
const BRAND_NAME = DEFAULT_CONFIG.brands[process.env.BRAND_NAME]
  ? process.env.BRAND_NAME
  : 'SatuKredit';

let config;
try {
  config = require('../../../config');
} catch (e) {
  config = {};
}

const conf = (function () {
  const defaultConf = Object.assign(
    {},
    DEFAULT_CONFIG,
    DEFAULT_CONFIG.envs[ENV]
  );
  const defaultBrandConf = getBrandConfig(DEFAULT_CONFIG);
  const brandConf = getBrandConfig(config);
  const conf = _.omit(
    Object.assign(
      {},
      defaultConf,
      config,
      config.envs && config.envs[ENV],
      defaultBrandConf,
      brandConf
    ),
    ['envs', 'brands']
  );

  // overwrite config from command line
  for (const p in conf) {
    if (process.env[p]) {
      conf[p] = process.env[p];
    }
  }

  function getBrandConfig(config) {
    const conf = config.brands && config.brands[BRAND_NAME];
    if (!conf) {
      return {};
    }
    return Object.assign({}, conf, conf.envs && conf.envs[ENV]);
  }

  return conf;
})();

conf.BUILD_TIME = new Date().toISOString();
conf.CACHE_DIR_NAME = '.build-cache';
conf.USE_CACHE = process.env.BUILD_CACHE != '0';
conf.USE_HTTPS = process.env.USE_HTTPS == '1';
conf.ESLINT_FIX = process.env.ESLINT_FIX == '1';
conf.BRAND_NAME = BRAND_NAME;
conf.PROJECT_VERSION = process.env.PROJECT_VERSION || '';
conf.PROJECT_NAME
  = process.env.PROJECT_NAME
  || process
    .cwd()
    .split(path.sep)
    .pop();
conf.BASE_PROJECT_NAME
  = process.env.BASE_PROJECT_NAME
  || config.baseProjectName
  || (conf.PROJECT_NAME.indexOf('webui-m-') === 0 ? 'webui-m-base' : 'webui-base');
conf.IS_BASE_PROJECT = conf.PROJECT_NAME == conf.BASE_PROJECT_NAME;
conf.ENV = ENV;
conf.VERSION_DIGEST_LEN = 4;
conf.IS_PRODUCTION = ENV == 'production';

let ossAccessKey = null;
conf.getOssAccessKey = function () {
  if (ossAccessKey) {
    return ossAccessKey;
  }
  const id = process.env.OSS_ACCESS_KEY_ID;
  const secret = process.env.OSS_ACCESS_KEY_SECRET;
  if (id && secret) {
    ossAccessKey = {
      id: id,
      secret: secret
    };
  } else {
    const accessKeyPath
      = (conf.oss && conf.oss.accessKeyPath)
      || '/usr/local/etc/lepin/oss-access-key';
    if (!fs.existsSync(accessKeyPath)) {
      throw new Error(
        'OSS access key file "' + accessKeyPath + '" does not exist!'
      );
    }
    const content = fs.readFileSync(accessKeyPath).toString();
    const keys = content.split('\n')[0].split(' ');
    ossAccessKey = {
      id: keys[0],
      secret: keys[1]
    };
  }
  return ossAccessKey;
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

log(
  'Running env '
    + chalk.green(ENV)
    + ' with brand '
    + chalk.green(BRAND_NAME)
    + ' and config '
    + chalk.gray(JSON.stringify(conf, null, 2))
);

module.exports = conf;
