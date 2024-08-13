import { useEffect, useReducer, useState } from 'react';
import { subscribe } from '../core/subscribe';
import type { Path, Proxiable } from '../core/types';
import type { ReadonlyDeep } from './types';

export function useSnapshot<T extends Proxiable>(object: T): ReadonlyDeep<T> {
	const [trackedPaths] = useState<Path[]>([]);

	const [, reRender] = useReducer((s) => !s, true);

	const [snapshot] = useState(() =>
		trackAccess(object, (path) => {
			if (!isTracked(path, trackedPaths)) {
				trackedPaths.push(path);
			}
		}),
	);

	useEffect(() => {
		return subscribe(object, (path) => {
			if (isTracked(path, trackedPaths)) {
				reRender();
			}
		});
	}, [object]);

	return snapshot as never;
}

function trackAccess(object: Proxiable, onAccess: (path: Path) => void) {
	for (const key in object) {
		const value = object[key];

		if (value && typeof value === 'object') {
			object[key] = trackAccess(value as Proxiable, (path) => {
				onAccess([key, ...path]);
			});
		}
	}

	return new Proxy(object, {
		get(target, key) {
			if (typeof key !== 'symbol') {
				onAccess([key]);
			}

			// A `Proxiable` could be an array, and accessing array keys will always resolve
			// as strings, so we need to cast it to tell TypeScript that it's ok.
			return Reflect.get(target, key as never);
		},
	});
}

function isTracked(pathToCheck: Path, trackedPaths: Path[]) {
	return trackedPaths.some(
		(path) => JSON.stringify(path) === JSON.stringify(pathToCheck),
	);
}
