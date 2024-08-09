import type { Morphable, Subscriber } from './types';
import { hasProxy, subscribe as subscribeKey, type Morhped } from './morph';

export function subscribe<T extends Morphable>(
	object: Morhped<T>,
	subscriber: Subscriber<T>,
) {
	// Catch runtime errors.
	if (!(hasProxy in object)) {
		throw new Error('Object is not morphed');
	}

	return object[subscribeKey](subscriber);
}
