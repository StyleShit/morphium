export const hasProxy = Symbol('hasProxy');
export const subscribers = Symbol('subscribers');
export const subscribe = Symbol('subscribe');

export type ProxyOptions = {
	path?: Array<string | number>;
};

export type Subscriber = (path: string[]) => void;

export type Proxiable = Record<string | number, unknown>;

export type Proxied<T extends Proxiable> = {
	[hasProxy]: true;
	[subscribers]: Set<Subscriber>;
	[subscribe]: (subscriber: Subscriber) => () => void;
} & {
	[K in keyof T]: T[K] extends Proxiable ? Proxied<T[K]> : T[K];
};

export function proxy<T extends Proxiable>(
	object: T,
	{ path = [] }: ProxyOptions = {},
): Proxied<T> {
	const _object = object as Proxied<T>;

	_object[hasProxy] = true;
	_object[subscribers] = new Set();

	_object[subscribe] = (subscriber) => {
		_object[subscribers].add(subscriber);

		return () => {
			_object[subscribers].delete(subscriber);
		};
	};

	return new Proxy<Proxied<T>>(_object, {
		get(target, key: string) {
			const value = Reflect.get(target, key);

			if (
				typeof key === 'symbol' &&
				[hasProxy, subscribers, subscribe].includes(key)
			) {
				return value;
			}

			if (typeof value === 'object' && value && !(hasProxy in value)) {
				const subProxy = proxy(value as Proxiable, {
					path: [...path, key],
				});

				subProxy[subscribe]((subPath) => {
					target[subscribers].forEach((subscriber) => {
						subscriber([key, ...subPath]);
					});
				});

				Reflect.set(target, key, subProxy);

				return subProxy;
			}

			return value;
		},

		set(target, key: string, value) {
			Reflect.set(target, key, value);

			target[subscribers].forEach((subscriber) => {
				subscriber([key]);
			});

			return true;
		},
	});
}
