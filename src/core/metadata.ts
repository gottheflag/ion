const hasOwn = Object.prototype.hasOwnProperty;

export function getOwn<T>(obj: object, key: symbol): T | undefined {
	return hasOwn.call(obj, key) ? ((obj as any)[ key ] as T) : undefined;
}

export function getOrInitOwn<T>(obj: object, key: symbol, init: () => T): T {
	if (!hasOwn.call(obj, key)) {
		Object.defineProperty(obj, key, {
			value: init(),
			writable: false,
			configurable: false
		});
	}

	return (obj as any)[ key ] as T;
}

const CLASS_ARRAY_CACHE =
	new WeakMap<object, Map<symbol, unknown[]>>();

export function collectClassArrays<T>(
	ctor: object,
	key: symbol
): T[] {
	let perClass = CLASS_ARRAY_CACHE.get(ctor);
	const cached = perClass?.get(key) as T[] | undefined;

	if (cached !== undefined) return cached.slice();

	const chain: object[] = [];
	let curr: any = ctor;

	while (curr && curr !== Function.prototype) {
		chain.push(curr);
		curr = Object.getPrototypeOf(curr);
	}

	chain.reverse();

	const out: T[] = [];

	for (const current of chain) {
		const own = getOwn<unknown>(current, key);

		if (Array.isArray(own)) {
			out.push(...(own as T[]));
		}
	}

	if (!perClass) {
		perClass = new Map();
		CLASS_ARRAY_CACHE.set(ctor, perClass);
	}

	perClass.set(
		key,
		out.slice() as unknown[]
	);

	return out;
}
