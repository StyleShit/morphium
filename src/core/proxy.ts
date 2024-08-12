import { isProxiable, isProxied } from './utils';
import type { Key, ObjectToPaths, Path, Proxiable, Subscriber } from './types';

export const hasProxy = Symbol('hasProxy');
export const subscribers = Symbol('subscribers');
export const subscribe = Symbol('subscribe');
export const parents = Symbol('parents');
export const notify = Symbol('notify');

export type Proxied<T extends Proxiable = Proxiable> = {
	[hasProxy]: true;
	[parents]: Map<Proxied, Key>;
	[subscribers]: Set<Subscriber<T>>;
	[subscribe]: (subscriber: Subscriber<T>) => () => void;
	[notify]: (path: ObjectToPaths<T>) => void;
} & {
	[K in keyof T]: T[K] extends Proxiable ? Proxied<T[K]> : T[K];
};

type Parent = {
	ref: Proxied;
	key: Key;
};

export function proxy<T extends Proxiable>(object: T, parent?: Parent) {
	const _object = object as Proxied<T>;

	// Set internal flags / values.
	_object[hasProxy] = true;
	_object[subscribers] = new Set();
	_object[parents] = createParents(parent);
	_object[subscribe] = createSubscribe(_object);
	_object[notify] = createNotify(_object);

	// Proxy the children recursively.
	proxyDeep(_object as never);

	return new Proxy(_object, {
		set(target, key, newValue) {
			// Ignore internal properties.
			if (typeof key === 'symbol') {
				return Reflect.set(target, key, newValue);
			}

			const prevValue = Reflect.get(target, key);

			// Detach the previous value from the current object.
			if (isProxied(prevValue)) {
				prevValue[parents].delete(target as never);
			}

			// Attach the new value to the current object.
			if (isProxied(newValue)) {
				newValue[parents].set(target as never, key);
			}

			// Proxy the new value, and attach it to the current object.
			if (isProxiable(newValue) && !isProxied(newValue)) {
				newValue = proxy(newValue, {
					ref: target as never,
					key,
				});
			}

			Reflect.set(target, key, newValue);

			target[notify]([key] as ObjectToPaths<T>);

			return true;
		},
	});
}

function proxyDeep(object: Proxied) {
	Object.entries(object).forEach(([key, value]) => {
		if (isProxiable(value)) {
			const parent = { ref: object, key };

			object[key] = proxy(value, parent);
		}
	});
}

function createSubscribe<T extends Proxiable>(object: Proxied<T>) {
	return (subscriber: Subscriber<T>) => {
		object[subscribers].add(subscriber);

		return () => {
			object[subscribers].delete(subscriber);
		};
	};
}

function createParents(defaultParent?: Parent) {
	const parents = new Map<Proxied, Key>();

	if (defaultParent) {
		parents.set(defaultParent.ref, defaultParent.key);
	}

	return parents;
}

function createNotify<T extends Proxiable>(object: Proxied<T>) {
	return (path: Path) => {
		// Notify self subscribers.
		object[subscribers].forEach((subscriber) => {
			subscriber(path as ObjectToPaths<T>);
		});

		// Notify parent subscribers.
		[...object[parents].entries()].forEach(([parent, key]) => {
			parent[notify]([key, ...path] as ObjectToPaths<T>);
		});
	};
}
