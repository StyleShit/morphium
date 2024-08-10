import { useEffect, useReducer, useState } from 'react';
import { subscribe } from '../core/subscribe';
import type { Proxiable } from '../core/types';
import type { ReadonlyDeep } from './types';

type Path = Array<string | number>;

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
	Object.entries(object).forEach(([key, value]) => {
		if (value && typeof value === 'object') {
			object[key] = trackAccess(value as Proxiable, (path) => {
				onAccess([key, ...path]);
			});
		}
	});

	return new Proxy(object, {
		get(target, key: string) {
			if (typeof key !== 'symbol') {
				onAccess([key]);
			}

			return target[key];
		},
	});
}

function isTracked(pathToCheck: Path, trackedPaths: Path[]) {
	return trackedPaths.some(
		(path) => JSON.stringify(path) === JSON.stringify(pathToCheck),
	);
}
