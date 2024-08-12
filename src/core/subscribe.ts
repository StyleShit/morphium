import type { Proxiable, Subscriber } from './types';
import { subscribe as subscribeKey } from './proxy';
import { isProxied } from './utils';

export function subscribe<T extends Proxiable>(
	object: T,
	subscriber: Subscriber<T>,
) {
	if (!isProxied(object)) {
		throw new Error('Object is not morphed');
	}

	return object[subscribeKey](subscriber as never);
}
