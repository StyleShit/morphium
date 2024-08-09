import { describe, expect, it, vi } from 'vitest';
import { morph } from '../morph';
import { subscribe } from '../subscribe';

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
});
