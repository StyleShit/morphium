export type Subscriber<T extends Proxiable> = (path: ObjectToPaths<T>) => void;

export type Proxiable = Record<string | number, unknown>;

export type ObjectToPaths<T> = T extends unknown[]
	? [number | `${number}`]
	: T extends object
		?
				| []
				| {
						[K in keyof T]: T[K] extends object
							? [K] | [K, ...ObjectToPaths<T[K]>]
							: [K];
				  }[keyof T]
		: [];

export type GetByPath<T, P extends ObjectToPaths<T>> = P extends []
	? T
	: P extends [infer F, ...infer R]
		? F extends keyof T
			? R extends ObjectToPaths<T[F]>
				? GetByPath<T[F], R>
				: T[F]
			: never
		: never;
