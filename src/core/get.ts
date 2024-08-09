import type { Morhped } from './morph';
import type { GetByPath, ObjectToPaths, Morphable } from './types';

export function get<T extends Morphable, const P extends ObjectToPaths<T>>(
	object: Morhped<T> | T,
	path: P,
): GetByPath<T, P> {
	if (typeof object !== 'object') {
		throw new Error(`Invalid object provided: ${JSON.stringify(object)}`);
	}

	let result: unknown = object;

	for (const key of path) {
		if (typeof result !== 'object' || !result || !(key in result)) {
			throw new Error(
				`Invalid path (${path.join('.')}) provided for object: ${JSON.stringify(object)}`,
			);
		}

		result = result[key as keyof typeof result];
	}

	return result as never;
}
