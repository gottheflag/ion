export function withDefaults<T extends object, D extends Partial<T>>(
	options: Partial<T> | undefined,
	defaults: D
): T & D {
	return {
		...defaults,
		...(options ?? {}),
	} as T & D;
}
