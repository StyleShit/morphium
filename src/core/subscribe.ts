import {
	hasProxy,
	subscribe as subscribeKey,
	type Proxiable,
	type Proxied,
	type Subscriber,
} from './proxy';

export function subscribe(object: Proxied, subscriber: Subscriber) {
	if (!isProxied(object)) {
		throw new Error('Object is not morphed');
	}

	return object[subscribeKey](subscriber);
}

function isProxied(object: Proxiable) {
	return hasProxy in object;
}
