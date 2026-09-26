export function assertNoArguments(
	key: string | symbol,
	args: readonly unknown[]
): void {
	if (args.length === 0) return;

	throw new TypeError(
		`[ION::CACHE] @cache method "${String(key)}" does not accept arguments.`
	);
}