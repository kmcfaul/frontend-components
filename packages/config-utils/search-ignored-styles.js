const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

function logWarning(message) {
  console.log(chalk.blue('[fec]') + chalk.yellow(' WARNING: ') + message);
}

/**
 * Function that searches for all patternfly styles in node_modules and outputs an webpack alias object to ignore found modules.
 * @param {string} root absolute directory path to root folder containig package.json
 * @param {string[]} ...paths node_modulesDirectories
 * @returns {Object}
 */
const searchIgnoredStyles = (root, ...paths) => {
  const modulesPaths = [path.join(root, 'node_modules/@patternfly/react-styles'), ...paths.map((path) => `${path}/@patternfly/react-styles`)];
  const result = modulesPaths
    .map((modulesPath) => glob.sync(`${modulesPath}/**/*.css`))
    .flat()
    .reduce(
      (acc, curr) => ({
        ...acc,
        [curr]: false,
      }),
      {}
    );
  if (Object.keys(result).length === 0) {
    logWarning(`No PF CSS assets found!
    Your application can override PF styling in deployed environments!
    Please check your build configuration.
    If your node_modules directory is not located at application root, provide the "nodeModulesDirectories" configuration in your build config.
    Make sure to use absolute path to your node_modules.\n`);
  }
  return result;
};

module.exports = searchIgnoredStyles;
