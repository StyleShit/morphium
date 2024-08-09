import {
	hasProxy,
	subscribe as subscribeKey,
	type Proxiable,
	type Proxied,
	type Subscriber,
} from './proxy';

export function subscribe(object: Proxiable, subscriber: Subscriber) {
	if (!isProxied(object)) {
		throw new Error('Object is not morphed');
	}

	return object[subscribeKey](subscriber);
}

function isProxied<T extends Proxiable>(object: T): object is T & Proxied<T> {
	return hasProxy in object;
}
