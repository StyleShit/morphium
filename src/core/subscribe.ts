import type { Proxiable, Subscriber } from './types';
import { hasProxy, subscribe as subscribeKey, type Proxied } from './proxy';

export function subscribe<T extends Proxiable>(
	object: T,
	subscriber: Subscriber<T>,
) {
	if (!isProxied(object)) {
		throw new Error('Object is not morphed');
	}

	return object[subscribeKey](subscriber as never);
}

function isProxied(object: Proxiable): object is Proxied {
	return hasProxy in object;
}
