import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { morph } from '../morph';
import { subscribe } from '../subscribe';
import { get } from '../get';

describe('Morphium', () => {
	it('should return an immutable object', () => {
		// Arrange.
		const morphed = morph({ path: { to: { value: 'test' } } });

		// Assert.
		expect(morphed.path.to.value).toBe('test');

		// Act.
		morphed.path.to.value = 'changed';

		// Assert.
		expect(morphed.path.to.value).toBe('changed');

		expectTypeOf(morphed).toEqualTypeOf<{
			path: { to: { value: string } };
		}>();
	});

	it('should return only user-defined keys when using Object.keys()', () => {
		// Arrange.
		const morphed = morph({
			key1: 'value1',
			key2: 'value2',
		});

		// Act & Assert.
		expect(Object.keys(morphed)).toEqual(['key1', 'key2']);
	});

	it('should subscribe to changes', () => {
		// Arrange.
		const morphed = morph({ path: { to: { value: 'test' } } });
		const subscriber = vi.fn();

		// Act.
		const unsubscribe = subscribe(morphed, subscriber);

		// Assert.
		expect(subscriber).toHaveBeenCalledTimes(0);

		// Act.
		morphed.path.to.value = 'changed';

		// Assert.
		expect(subscriber).toHaveBeenCalledTimes(1);
		expect(subscriber).toHaveBeenCalledWith(['path', 'to', 'value']);

		// Act.
		unsubscribe();

		morphed.path.to.value = 'changed again';

		// Assert.
		expect(subscriber).toHaveBeenCalledTimes(1);

		subscribe(morphed, (path) => {
			expectTypeOf(path).toEqualTypeOf<
				[] | ['path'] | ['path', 'to'] | ['path', 'to', 'value']
			>();
		});
	});

	it('should subscribe to parts of a morphed object', () => {
		// Arrange.
		const morphed = morph({ path: { to: { value: 'test' } } });
		const subscriber = vi.fn();

		// Act.
		subscribe(morphed.path.to, subscriber);

		morphed.path.to.value = 'changed';

		// Assert.
		expect(subscriber).toHaveBeenCalledTimes(1);
		expect(subscriber).toHaveBeenCalledWith(['value']);
	});

	it('should support array writes', () => {
		// Arrange.
		const morphed = morph({ array: [1, 2, 3] });
		const subscriber = vi.fn();

		// For some reason, the `expect().toEqual()` function doesn't work properly
		// with proxied arrays.
		const expectEquals = (array1: number[], array2: number[]) => {
			expect(array1).toHaveLength(array2.length);

			array1.forEach((value, index) => {
				expect(value).toBe(array2[index]);
			});
		};

		// Act.
		subscribe(morphed, subscriber);

		// Assert.
		expectEquals(morphed.array, [1, 2, 3]);

		// Act.
		morphed.array[1] = 4;

		// Assert.
		expect(subscriber).toHaveBeenCalledTimes(1);
		expect(subscriber).toHaveBeenNthCalledWith(1, ['array', '1']);
		expectEquals(morphed.array, [1, 4, 3]);

		// Act.
		morphed.array.push(5);

		// Assert.
		expect(subscriber).toHaveBeenCalledTimes(3);
		expect(subscriber).toHaveBeenNthCalledWith(2, ['array', '3']);
		expect(subscriber).toHaveBeenNthCalledWith(3, ['array', 'length']);
		expectEquals(morphed.array, [1, 4, 3, 5]);

		// Act.
		morphed.array.pop();

		// Assert.
		expect(subscriber).toHaveBeenCalledTimes(4);
		expect(subscriber).toHaveBeenNthCalledWith(4, ['array', 'length']);
		expectEquals(morphed.array, [1, 4, 3]);
	});

	it('should throw when trying to subscribe to a non-morphed object', () => {
		// Act & Assert.
		expect(() => {
			subscribe({ notMorphed: true }, () => {});
		}).toThrow('Object is not morphed');
	});

	it('should skip symbol keys', () => {
		// Arrange.
		const symbolKey = Symbol('key');

		const morphed = morph({
			[symbolKey]: {
				value: 'symbol-value',
			},
			otherKey: {
				value: 'other-value',
			},
		});

		const subscriber = vi.fn();

		// Act.
		subscribe(morphed, subscriber);

		morphed[symbolKey] = {
			value: 'changed',
		};

		morphed[symbolKey].value = 'changed-again';

		// Assert.
		expect(subscriber).toHaveBeenCalledTimes(0);
	});

	it('should detach and reattach children properly', () => {
		// Arrange.
		const morphed = morph({ name: { first: 'John', last: 'Doe' } });

		const oldName = morphed.name;

		morphed.name = {
			first: 'Jane',
			last: 'Doe',
		};

		const rootSubscriber = vi.fn();
		const nameSubscriber = vi.fn();

		subscribe(morphed, rootSubscriber);
		subscribe(oldName, nameSubscriber);

		// Act - Change the detached object.
		oldName.first = 'New Name';

		// Assert.
		expect(rootSubscriber).toHaveBeenCalledTimes(0);
		expect(nameSubscriber).toHaveBeenCalledTimes(1);
		expect(nameSubscriber).nthCalledWith(1, ['first']);

		// Act - Reattach the object.
		morphed.name = oldName;

		oldName.first = 'Another Name';

		// Assert.
		expect(rootSubscriber).toHaveBeenCalledTimes(2);
		expect(rootSubscriber).nthCalledWith(1, ['name']);
		expect(rootSubscriber).nthCalledWith(2, ['name', 'first']);

		expect(nameSubscriber).toHaveBeenCalledTimes(2);
		expect(nameSubscriber).nthCalledWith(2, ['first']);
	});

	it('should notify all attached parents', () => {
		// Arrange.
		const morphed1 = morph({ child: { count: 1 } });
		const morphed2 = morph({ child: { count: 2 } });

		morphed2.child = morphed1.child;

		const subscriber1 = vi.fn();
		const subscriber2 = vi.fn();

		subscribe(morphed1, subscriber1);
		subscribe(morphed2, subscriber2);

		// Act.
		morphed1.child.count = 3;

		// Assert.
		expect(subscriber1).toHaveBeenCalledTimes(1);
		expect(subscriber1).toHaveBeenCalledWith(['child', 'count']);

		expect(subscriber2).toHaveBeenCalledTimes(1);
		expect(subscriber2).toHaveBeenCalledWith(['child', 'count']);
	});

	it('should return values from object by path', () => {
		// Arrange.
		type State = {
			user: {
				name: string;
				age: number;
			};
			posts: number[];
			friends: [number, number, number];
		};

		const morphed = morph<State>({
			user: {
				name: 'John Doe',
				age: 30,
			},
			posts: [1, 2, 3],
			friends: [1, 2, 3],
		});

		// Act.
		const root = get(morphed, []);
		const userName = get(morphed, ['user', 'name']);
		const userAge = get(morphed, ['user', 'age']);
		const posts = get(morphed, ['posts']);
		const postsLength = get(morphed, ['posts', 'length']);
		const friends = get(morphed, ['friends']);
		const friendsLength = get(morphed, ['friends', 'length']);

		// Assert.
		expect(root).toBe(morphed);
		expect(userName).toBe('John Doe');
		expect(userAge).toBe(30);
		expect(posts).toBe(morphed.posts);
		expect(friends).toBe(morphed.friends);

		expectTypeOf(root).toEqualTypeOf<State>();
		expectTypeOf(userName).toEqualTypeOf<string>();
		expectTypeOf(userAge).toEqualTypeOf<number>();
		expectTypeOf(posts).toEqualTypeOf<number[]>();
		expectTypeOf(postsLength).toEqualTypeOf<number>();
		expectTypeOf(friends).toEqualTypeOf<[number, number, number]>();
		expectTypeOf(friendsLength).toEqualTypeOf<3>();
	});

	it('should throw when trying to read from a non object', () => {
		// Act & Assert.
		expect(() => {
			// @ts-expect-error - Mock runtime behavior.
			get('not an object', ['key']);
		}).toThrow('Invalid object provided: "not an object"');
	});

	it('should throw when trying to read invalid path from object', () => {
		// Arrange.
		const morphed = morph({ path: { to: { value: 'test' } } });

		// Act & Assert.
		expect(() => {
			// @ts-expect-error - Mock runtime behavior.
			get(morphed, ['invalid', 'path']);
		}).toThrow(
			'Invalid path (invalid.path) provided for object: {"path":{"to":{"value":"test"}}}',
		);
	});
});
