import type { Ctor } from "./types.js";

/**
 * Gets the key of a plugin.
 * Used to store the plugin on a component instance.
 * 
 * @param plugin The plugin constructor.
 * @returns The plugin key.
 * 
 * @internal
 */
export function keyOf(plugin: Ctor) {
	return plugin.id ?? plugin;
}