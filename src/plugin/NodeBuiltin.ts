import { URL } from '../URL';
import { Record } from '../Record';
import { features, nodeRequire } from '../platform';
import { Loader, LoaderPlugin } from '../Loader';

const emptyPromise = Promise.resolve();

export const isInternal: { [key: string]: boolean } = {};

for(let key of 'assert buffer crypto events fs http https module net os path stream url util vm zlib'.split(' ')) {
	isInternal[key] = true;
}

/** Node.js load plugin for built-in modules. */

export class Node implements LoaderPlugin {

	constructor(private loader: Loader) { }

	nodeShims = ((loader: Loader) => ({
		path: {
			dirname: (key: string) => {
				let prefix = '';

				if(features.isWin) {
					const parts = key.match(/^([A-Za-z]+:)?(.*)/)!;
					prefix = parts[1] || '';
					key = parts[2];
				}

				const slash = key.lastIndexOf('/', key.length - 2);

				return prefix + key.substr(0, slash + +!slash) || '.';
			},
			extname: (key: string) => {
				const pos = key.lastIndexOf('.');
				const c = key.charAt(pos - 1);

				return (pos < 1 || c == '/' ||
					(features.isWin && c == ':') ? '' : key.substr(pos)
				);
			},
			isAbsolute: (key: string) => (
				key.charAt(0) == '/' ||
				(features.isWin && key.match(/^[A-Za-z]+:\//))
			),
			relative: (base: string, key: string) => {
				return URL.relative(
					URL.resolve(loader.cwd, base),
					URL.resolve(loader.cwd, key)
				);
			},
			resolve: (...args: string[]) => {
				let result = loader.cwd;

				for(let arg of args) {
					result = URL.resolve(result, arg);
				}

				return result;
			},
			sep: '/'
		},
		util: {
			// TODO
			// inherits: () => { }
		}
	} as { [name: string]: any }))(this.loader);

	fetchRecord(record: Record) {
		return emptyPromise;
	}

	instantiate(record: Record) {
		const native = nodeRequire(record.resolvedKey);
		const shim = this.nodeShims[record.resolvedKey] || {};

		for(let name in native) {
			record.moduleInternal.exports[name] = shim[name] || native[name];
		}

		return record.moduleInternal.exports;
	}

}
