export const hasProxy = Symbol('hasProxy');

export type ProxyOptions = {
	path?: Array<string | number>;
};

export type Proxiable = Record<string | number, unknown>;

export type Proxied<T extends Proxiable> = {
	[hasProxy]: true;
} & {
	[K in keyof T]: T[K] extends Proxiable ? Proxied<T[K]> : T[K];
};

export function proxy<T extends Proxiable>(
	object: T,
	{ path = [] }: ProxyOptions = {},
): Proxied<T> {
	const _object = object as Proxied<T>;

	_object[hasProxy] = true;

	return new Proxy<Proxied<T>>(_object, {
		get(target, key: string) {
			const value = Reflect.get(target, key);

			if (typeof key === 'symbol' && key === hasProxy) {
				return value;
			}

			if (typeof value === 'object' && value && !(hasProxy in value)) {
				const subProxy = proxy(value as Proxiable, {
					path: [...path, key],
				});

				Reflect.set(target, key, subProxy);

				return subProxy;
			}

			return value;
		},

		set(target, key: string, value) {
			Reflect.set(target, key, value);

			return true;
		},
	});
}
