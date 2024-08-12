import { hasProxy, type Proxied } from './proxy';
import type { Proxiable } from './types';

export function isProxiable(object: unknown): object is Proxiable {
	return typeof object === 'object' && object !== null;
}

export function isProxied(object: unknown): object is Proxied {
	return typeof object === 'object' && object !== null && hasProxy in object;
}
