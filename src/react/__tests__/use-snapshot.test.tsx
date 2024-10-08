import * as React from 'react';
import { act } from 'react';
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	expectTypeOf,
	it,
	vi,
} from 'vitest';
import { useSnapshot } from '../use-snapshot';
import { render, renderHook, screen } from '@testing-library/react';
import { morph } from '../../core/morph';

describe('useSnapshot', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

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
			vi.runAllTimers();
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
			vi.runAllTimers();
		});

		// Assert.
		expect(button).toHaveTextContent('1');
	});

	it('should re-render on array write', () => {
		// Arrange.
		const state = morph({ users: [1, 2, 3] });

		// Act.
		const Component = () => {
			const snapshot = useSnapshot(state);

			return (
				<button onClick={() => (state.users[0] = 0)}>
					{JSON.stringify(snapshot.users)}
				</button>
			);
		};

		render(<Component />);

		// Assert.
		const button = screen.getByRole('button');

		expect(button).toHaveTextContent('[1,2,3]');

		// Act.
		act(() => {
			button.click();
			vi.runAllTimers();
		});

		// Assert.
		expect(button).toHaveTextContent('[0,2,3]');
	});

	it('should re-render on array push', () => {
		// Arrange.
		const state = morph({ users: [1, 2, 3] });

		// Act.
		const Component = () => {
			const snapshot = useSnapshot(state);

			return (
				<button onClick={() => state.users.push(4)}>
					{JSON.stringify(snapshot.users)}
				</button>
			);
		};

		render(<Component />);

		// Assert.
		const button = screen.getByRole('button');

		expect(button).toHaveTextContent('[1,2,3]');

		// Act.
		act(() => {
			button.click();
			vi.runAllTimers();
		});

		// Assert.
		expect(button).toHaveTextContent('[1,2,3,4]');
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
			vi.runAllTimers();
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
			vi.runAllTimers();
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
			vi.runAllTimers();
		});

		// Assert.
		expect(screen.getByRole('button')).toHaveTextContent('1');
	});

	it('should batch re-renders on multiple state changes', () => {
		// Arrange.
		const state = morph({ count: 0 });
		let rendersCount = 0;

		// Act.
		const Component = () => {
			rendersCount++;

			const snapshot = useSnapshot(state);

			return <button>{snapshot.count}</button>;
		};

		render(<Component />);

		// Act.
		act(() => {
			state.count++;
			state.count++;
			state.count++;
			state.count++;

			vi.runAllTimers();
		});

		// Assert.
		expect(rendersCount).toBe(2);
		expect(screen.getByRole('button')).toHaveTextContent('4');
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
			vi.runAllTimers();
		});

		// Assert.
		expect(renderCount).toBe(1);
	});

	it('should return a readonly snapshot', () => {
		// Arrange.
		const state = morph({
			user: {
				name: 'John',
				age: 42,
			},
		});

		const { result } = renderHook(() => useSnapshot(state));

		// Assert.
		expectTypeOf(result.current).toEqualTypeOf<{
			readonly user: {
				readonly name: string;
				readonly age: number;
			};
		}>();
	});
});
