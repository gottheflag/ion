/**
 * @internal
 */
type Collection<K, V> = {
	get(key: K): V | undefined;
	set(key: K, value: V): unknown;
};

/**
 * Gets an existing value or initializes it.
 *
 * @internal
 */
export function getOrInit<K, V>(
	map: Collection<K, V>,
	key: K,
	init: () => V
): V {
	const value = map.get(key);

	if (value !== undefined) {
		return value;
	}

	const next = init();

	map.set(
		key,
		next
	);

	return next;
}