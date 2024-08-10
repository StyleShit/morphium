import { proxy } from './proxy';
import type { Proxiable } from './types';

export function morph<T extends Proxiable>(object: T): T {
	// Return the proxied object as the original type so users can mutate it.
	return proxy(object) as T;
}
