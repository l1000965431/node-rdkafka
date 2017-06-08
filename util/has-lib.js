'use strict';

/**
 * Copied from node-canvas library
 */
// https://raw.githubusercontent.com/Automattic/node-canvas/master/util/has_lib.js

var query = process.argv[2];
var fs = require('fs');
var childProcess = require('child_process');

var SYSTEM_PATHS = [
  '/lib',
  '/usr/lib',
  '/usr/local/lib',
  '/opt/local/lib',
  '/usr/lib/x86_64-linux-gnu',
  '/usr/lib/i386-linux-gnu'
];

/**
 * Checks for lib using ldconfig if present, or searching SYSTEM_PATHS
 * otherwise.
 * @param String library name, e.g. 'jpeg' in 'libjpeg64.so' (see first line)
 * @return Boolean exists
 */
function hasSystemLib (lib) {
  var libName = 'lib' + lib + '.+(so|dylib)';
  var libNameRegex = new RegExp(libName);

    // Try using ldconfig on linux systems
  if (hasLdconfig()) {
    try {
      if (childProcess.execSync('ldconfig -p 2>/dev/null | grep -E "' + libName + '"').length) {
        return true;
      }
    } catch (err) {
      // noop -- proceed to other search methods
    }
  }

    // Try checking common library locations
  return SYSTEM_PATHS.some(function (systemPath) {
    try {
      var dirListing = fs.readdirSync(systemPath);
      return dirListing.some(function (file) {
        return libNameRegex.test(file);
      });
    } catch (err) {
      return false;
    }
  });
}

/**
 * Checks for ldconfig on the path and /sbin
 * @return Boolean exists
 */
function hasLdconfig () {
  try {
    // Add /sbin to path as ldconfig is located there on some systems -- e.g.
    // Debian (and it can still be used by unprivileged users):
    childProcess.execSync('export PATH="$PATH:/sbin"');
    process.env.PATH = '...';
    // execSync throws on nonzero exit
    childProcess.execSync('hash ldconfig 2>/dev/null');
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Checks for lib using pkg-config.
 * @param String library name
 * @return Boolean exists
 */
function hasPkgconfigLib (lib) {
  try {
    // execSync throws on nonzero exit
    childProcess.execSync('pkg-config --exists "' + lib + '" 2>/dev/null');
    return true;
  } catch (err) {
    return false;
  }
}

function main (query) {
  switch (query) {
    case 'sasl':
    case 'lz4':
      return hasSystemLib(query);
    case 'openssl':
    case 'ssl':
      return hasPkgconfigLib(query);
    default:
      throw new Error('Unknown library: ' + query);
  }
}

process.stdout.write(main(query).toString());
