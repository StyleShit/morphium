import * as React from 'react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { useSnapshot } from '../use-snapshot';
import { render, screen } from '@testing-library/react';
import { morph } from '../../core/morph';

describe('useSnapshot', () => {
	it('should re-render on shallow state changes', () => {
		// Arrange.
		const state = morph({ count: 0 });

		// Act.
		const Component = () => {
			const snapshot = useSnapshot(state);

			return (
				<button onClick={() => state.count++}>{snapshot.count}</button>
			);
		};

		render(<Component />);

		// Assert.
		const button = screen.getByRole('button');

		expect(button).toHaveTextContent('0');

		// Act.
		act(() => {
			button.click();
		});

		// Assert.
		expect(button).toHaveTextContent('1');
	});

	it('should re-render on deep state changes', () => {
		// Arrange.
		const state = morph({ path: { to: { count: 0 } } });

		// Act.
		const Component = () => {
			const snapshot = useSnapshot(state);

			return (
				<button onClick={() => state.path.to.count++}>
					{snapshot.path.to.count}
				</button>
			);
		};

		render(<Component />);

		// Assert.
		const button = screen.getByRole('button');

		expect(button).toHaveTextContent('0');

		// Act.
		act(() => {
			button.click();
		});

		// Assert.
		expect(button).toHaveTextContent('1');
	});

	it('should re-render on partial state snapshot', () => {
		// Arrange.
		const state = morph({ path: { to: { count: 0 } } });

		// Act.
		const Component = () => {
			const snapshot = useSnapshot(state.path.to);

			return (
				<button onClick={() => state.path.to.count++}>
					{snapshot.count}
				</button>
			);
		};

		render(<Component />);

		// Assert.
		const button = screen.getByRole('button');

		expect(button).toHaveTextContent('0');

		// Act.
		act(() => {
			button.click();
		});

		// Assert.
		expect(button).toHaveTextContent('1');
	});

	it('should re-render on parent object change', () => {
		// Arrange.
		const state = morph({ path: { to: { count: 0 } } });

		// Act.
		const Component = () => {
			const snapshot = useSnapshot(state);

			return (
				<button
					onClick={() => {
						state.path = { to: { count: 42 } };
					}}
				>
					{snapshot.path.to.count}
				</button>
			);
		};

		render(<Component />);

		// Assert.
		const button = screen.getByRole('button');

		expect(button).toHaveTextContent('0');

		// Act.
		act(() => {
			button.click();
		});

		// Assert.
		expect(button).toHaveTextContent('42');
	});

	it('should re-render on external state changes', () => {
		// Arrange.
		const state = morph({ path: { to: { count: 0 } } });

		// Act.
		const Component = () => {
			const snapshot = useSnapshot(state);

			return <button>{snapshot.path.to.count}</button>;
		};

		render(<Component />);

		// Act.
		act(() => {
			state.path.to.count++;
		});

		// Assert.
		expect(screen.getByRole('button')).toHaveTextContent('1');
	});

	it('should not re-render on untracked state changes', () => {
		// Arrange.
		const state = morph({
			path: {
				to: {
					count: 0,
					name: 'John',
				},
			},
		});

		let renderCount = 0;

		// Act.
		const Component = () => {
			renderCount++;

			const snapshot = useSnapshot(state);

			return <button>{snapshot.path.to.count}</button>;
		};

		render(<Component />);

		// Act.
		act(() => {
			state.path.to.name = 'Jane';
		});

		// Assert.
		expect(renderCount).toBe(1);
	});
});
