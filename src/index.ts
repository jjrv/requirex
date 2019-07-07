import { features, globalEnv, getTags } from './platform';
import { Loader, LoaderConfig } from './Loader';

import { JS } from './plugin/JS';
import { AMD } from './plugin/AMD';
import { CJS } from './plugin/CJS';
import { Register } from './plugin/Register';
import { TS } from './plugin/TS';
import { PostCSS } from './plugin/PostCSS';
import { CSS } from './plugin/CSS';
import { TXT } from './plugin/TXT';
import { Json } from './plugin/Json';
import { Node } from './plugin/NodeBuiltin';
import { NodeResolve } from './plugin/NodeResolve';
import { Document } from './plugin/Document';
import { Cache } from './plugin/Cache';

import { URL } from './URL';
import { fetch, FetchResponse } from './fetch';

export { LoaderConfig };
export { features, URL, fetch, FetchResponse, Loader };

const internals = {
	features, URL, fetch, FetchResponse, Loader
};

features.fetch = fetch;

/** This module, importable from code running inside. */
const requirex = internals as typeof internals & { System: Loader };
const globalSystem = globalEnv.System;

export const System = new Loader({
	cdn: 'https://cdn.jsdelivr.net/npm/',
	globals: {
		process: features.isNode ? globalEnv.process : {
			argv: [ '/bin/node' ],
			cwd: () => System.cwd,
			env: { 'NODE_ENV': 'production' }
		}
	},
	plugins: {
		resolve: NodeResolve,

		JS,
		AMD,
		CJS,
		system: Register,
		esm: TS,
		TS,
		tsx: TS,
		'd.ts': TS,
		css: PostCSS,
		cssraw: CSS,
		TXT,
		vert: TXT,
		frag: TXT,
		Json,

		Node,
		Document,
		Cache
	},
	registry: {
		'@empty': {},
		// Prevent TypeScript compiler from importing an optional module.
		'source-map-support': {},
		requirex
	}
});

requirex.System = System;

if(!globalSystem) globalEnv.System = System;

if(getTags) {
	System.import('document!');
}
