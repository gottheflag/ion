export type PluginRuntimeBridge = {
	has(
		ctor: object,
		plugin: unknown
	): boolean;

	register(
		ctor: object,
		plugin: unknown,
		options?: unknown
	): unknown;

	get(
		host: object,
		plugin: unknown
	): unknown;

	collect(
		ctor: object
	): readonly unknown[];
};

let runtime:
	PluginRuntimeBridge | undefined;

export function installPluginRuntime(
	next: PluginRuntimeBridge
): void {
	runtime = next;
}

export function pluginRuntime(): PluginRuntimeBridge {
	if (!runtime) {
		throw new Error(
			"[ION::PLUGIN] Plugin support is not loaded. " +
			'Import "@gottheflag/ion/plugin" before using plugins.'
		);
	}

	return runtime;
}
