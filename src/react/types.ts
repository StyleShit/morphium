export type ReadonlyDeep<T> = T extends object
	? {
			readonly [K in keyof T]: ReadonlyDeep<T[K]>;
		}
	: T;
