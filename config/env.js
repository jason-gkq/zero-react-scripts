// @remove-on-eject-begin
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @remove-on-eject-end
'use strict';

const fs = require('fs');
// const path = require('path');
const paths = require('./paths');

// Make sure that including paths.js after env.js will read .env variables.
delete require.cache[require.resolve('./paths')];

// const NODE_ENV = process.env.NODE_ENV;
// if (!NODE_ENV) {
// 	throw new Error('The NODE_ENV environment variable is required but was not specified.');
// }

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
// const dotenvFiles = [
// 	`${paths.dotenv}.${NODE_ENV}.local`,
// 	// Don't include `.env.local` for `test` environment
// 	// since normally you expect tests to produce the same
// 	// results for everyone
// 	NODE_ENV !== 'test' && `${paths.dotenv}.local`,
// 	`${paths.dotenv}.${NODE_ENV}`,
// 	paths.dotenv
// ].filter(Boolean);

// Load environment variables from .env* files. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.  Variable expansion is supported in .env files.
// https://github.com/motdotla/dotenv
// https://github.com/motdotla/dotenv-expand
// dotenvFiles.forEach(dotenvFile => {
// 	if (fs.existsSync(dotenvFile)) {
// 		require('dotenv-expand')(
// 			require('dotenv').config({
// 				path: dotenvFile
// 			})
// 		);
// 	}
// });

// We support resolving modules according to `NODE_PATH`.
// This lets you use absolute paths in imports inside large monorepos:
// https://github.com/facebook/create-react-app/issues/253.
// It works similar to `NODE_PATH` in Node itself:
// https://nodejs.org/api/modules.html#modules_loading_from_the_global_folders
// Note that unlike in Node, only *relative* paths from `NODE_PATH` are honored.
// Otherwise, we risk importing Node.js core modules into an app instead of webpack shims.
// https://github.com/facebook/create-react-app/issues/1023#issuecomment-265344421
// We also resolve them to make sure all tools using them work consistently.
// const appDirectory = fs.realpathSync(process.cwd());
// process.env.NODE_PATH = (process.env.NODE_PATH || '')
// 	.split(path.delimiter)
// 	.filter(folder => folder && !path.isAbsolute(folder))
// 	.map(folder => path.resolve(appDirectory, folder))
// 	.join(path.delimiter);

// Grab NODE_ENV and REACT_APP_* environment variables and prepare them to be
// injected into the application via DefinePlugin in webpack configuration.
const REACT_APP = /^REACT_APP_/i;

function getClientEnvironment() {
	const raw = Object.keys(process.env).filter(key => REACT_APP.test(key)).reduce((env, key) => {
		env[key] = process.env[key];
		return env;
	}, {});
	const proEnv = getCliParams();
	if (fs.existsSync(`${paths.env}/env.${proEnv.env}.json`)) {
		Object.assign(raw, require(`${paths.env}/env.${proEnv.env}.json`), {
			env: proEnv.env
		});
	}
	// Stringify all values so we can feed into webpack DefinePlugin
	const stringified = {
		'process.env': Object.keys(raw).reduce((env, key) => {
			env[key] = JSON.stringify(raw[key]);
			return env;
		}, {})
	};

	return { raw, stringified };
}

function getAlias() {
	// const alias = {};
	// if (fs.existsSync(paths.appJsConfig)) {
	// 	const compilerOptions = require(paths.appJsConfig).compilerOptions || {};
	// 	Object.keys(compilerOptions.paths || {}).forEach(key => {
	// 		if (/\/$/.test(compilerOptions.paths[key])) {
	// 			alias[key] = paths.appPath + '/' + compilerOptions.paths[key][0].trim().slice(0, -1);
	// 		} else if (/\/\*$/.test(compilerOptions.paths[key])) {
	// 			alias[key] = paths.appPath + '/' + compilerOptions.paths[key][0].trim().slice(0, -2);
	// 		} else {
	// 			alias[key] = paths.appPath + '/' + compilerOptions.paths[key][0].trim();
	// 		}
	// 	});
	// }
	// return alias;
	return {
		'@assets': `${paths.appPath}/assets`,
		'@src': `${paths.appPath}/src`,
		'@common': `${paths.appPath}/Common`,
		'@components': `${paths.appPath}/components`,
		'@utils': `${paths.appPath}/utils`,
		'@menus': `${paths.appPath}/menus`,
		'@locales': `${paths.appPath}/locales`,
		'@redux': `${paths.appPath}/redux`
	};
}

function getCliParams() {
	const args = null;
	const params = process.argv.splice(2);

	if (!params.length) {
		throw new Error('The ENV environment variable is required but was not specified.');
	}

	params.forEach(arg => {
		const tmpArg = arg.trim().split('=');
		if (tmpArg.length) {
			args[tmpArg[0].replace(/\W+/g, '')] = tmpArg[1];
		} else {
			return false;
		}
	});
	if (!args || !args.env || !['local', 'dev', 'uat', 'pre', 'prod'].includes(args.env)) {
		throw new Error('The ENV environment variable is required but was not specified.');
	}
	return args;
}

module.exports.getClientEnvironment = getClientEnvironment;
module.exports.getAlias = getAlias;
module.exports.getCliParams = getCliParams;
