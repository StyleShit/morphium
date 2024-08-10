import type { Proxied } from './proxy';
import type { GetByPath, ObjectToPaths, Proxiable } from './types';

export function get<T extends Proxiable, const P extends ObjectToPaths<T>>(
	object: Proxied<T> | T,
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
