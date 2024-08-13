export type Subscriber<T extends Proxiable> = (path: ObjectToPaths<T>) => void;

export type Key = string | number;

export type Path = Key[];

export type Proxiable = Record<Key, unknown> | Array<unknown>;

/**
 * Get a union of tuples that represent all possible paths in an object.
 *
 * @example
 *
 * ```typescript
 * type Paths = ObjectToPaths<{
 * 	user: {
 * 		name: string;
 * 		age: number;
 * 	};
 * 	posts: number[];
 * 	friends: [number, number, number];
 * }>;
 * ```
 *
 * The `Paths` type will be:
 *	```typescript
 * | []
 * | ["user"]
 * | ["user", "name"]
 * | ["user", "age"]
 * | ["posts"]
 * | ["posts", "length" | number | `${number}`]
 * | ["friends"]
 * | ["friends", "length" | 0 | 1 | 2 | "0" | "1" | "2"]
 * ```
 */
export type ObjectToPaths<T> = T extends unknown[]
	? IsTuple<T> extends true
		? ['length' | TupleIndexes<T> | `${TupleIndexes<T>}`]
		: ['length' | number | `${number}`]
	: T extends object
		?
				| []
				| {
						[K in keyof T]: T[K] extends object
							? [K] | [K, ...ObjectToPaths<T[K]>]
							: [K];
				  }[keyof T]
		: [];

/**
 * Get the type of a value in an object by its path.
 *
 * @example
 *
 * ```typescript
 * type State = {
 * 	user: {
 * 		name: string;
 * 		age: number;
 * };
 *
 * type User = GetByPath<State, ["user"]>; // { name: string; age: number; }
 * type UserName = GetByPath<State, ["user", "name"]>; // string
 * type UserAge = GetByPath<State, ["user", "age"]>; // number
 * ```
 */
export type GetByPath<TObject, TPath extends Path> = TPath extends []
	? TObject
	: TPath extends [infer CurrentKey, ...infer RestPath extends Path]
		? CurrentKey extends keyof TObject
			? GetByPath<TObject[CurrentKey], RestPath>
			: never
		: never;

type IsTuple<T extends unknown[]> = number extends T['length'] ? false : true;

type TupleIndexes<
	Tuple extends readonly unknown[],
	Counter extends unknown[] = [],
> = Counter['length'] extends Tuple['length']
	? never
	: Counter['length'] | TupleIndexes<Tuple, [...Counter, null]>;
