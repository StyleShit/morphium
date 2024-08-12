import { describe, expect, it, vi } from 'vitest';
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

	it('should return values from object by path', () => {
		// Arrange.
		const morphed = morph({
			path: {
				to: {
					value: 'test',
					array: [1, 2, 3],
				},
			},
		});

		// Act.
		const rootValue = get(morphed, []);
		const nestedObjectValue = get(morphed, ['path', 'to']);
		const nestedArrayValue = get(morphed, ['path', 'to', 'array', 1]);
		const nestedStringValue = get(morphed, ['path', 'to', 'value']);

		// Assert.
		expect(rootValue).toBe(morphed);
		expect(nestedObjectValue).toBe(morphed.path.to);
		expect(nestedArrayValue).toBe(2);
		expect(nestedStringValue).toBe('test');
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
