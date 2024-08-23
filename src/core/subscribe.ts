import type { ObjectToPaths, Proxiable, Subscriber } from './types';
import { subscribe as subscribeKey } from './proxy';
import { isProxied } from './utils';

type MultiPathSubscriber<T extends Proxiable> = (
	paths: Array<ObjectToPaths<T>>,
) => void;

export function subscribe<T extends Proxiable>(
	object: T,
	subscriber: MultiPathSubscriber<T>,
	batchNotifications?: true,
): () => void;

export function subscribe<T extends Proxiable>(
	object: T,
	subscriber: Subscriber<T>,
	batchNotifications: false,
): () => void;

export function subscribe<T extends Proxiable>(
	object: T,
	subscriber: Subscriber<T> | MultiPathSubscriber<T>,
	batchNotifications: boolean = true,
): () => void {
	if (!isProxied(object)) {
		throw new Error('Object is not morphed');
	}

	if (batchNotifications) {
		subscriber = batchSubscriber(subscriber as MultiPathSubscriber<T>);
	}

	return object[subscribeKey](subscriber as never);
}

function batchSubscriber<T extends Proxiable>(
	subscriber: MultiPathSubscriber<T>,
): Subscriber<T> {
	let timeout: ReturnType<typeof setTimeout>;
	const collectedPaths: Array<ObjectToPaths<T>> = [];

	return function (path) {
		clearTimeout(timeout);

		collectedPaths.push(path);

		timeout = setTimeout(() => {
			subscriber(collectedPaths);
		}, 0);
	};
}
