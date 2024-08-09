import { describe, expect, it } from 'vitest';
import { morph } from '../morph';

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
});
