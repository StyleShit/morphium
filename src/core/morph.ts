import { proxy, type Proxiable } from './proxy';

export function morph<T extends Proxiable>(object: T) {
	return proxy(object);
}
