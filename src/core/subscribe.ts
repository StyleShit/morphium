import type { Proxiable, Subscriber } from './types';
import { hasProxy, subscribe as subscribeKey, type Proxied } from './proxy';

export function subscribe<T extends Proxiable>(
	object: Proxied<T>,
	subscriber: Subscriber<T>,
) {
	if (!isProxied(object)) {
		throw new Error('Object is not morphed');
	}

	return object[subscribeKey](subscriber);
}

function isProxied(object: Proxiable) {
	return hasProxy in object;
}
