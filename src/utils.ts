/**
 * Validate a component tag.
 * 
 * @param name Component tag to validate.
 * @throws Error if the tag is invalid.
 * 
 * ---
 * @example
 * assertValidTag("x-tag"); // valid
 * assertValidTag("tag"); // invalid
 * 
 * @see {@link https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name | HTML Spec}
 */
export function assertValidTag(name: string) {
	const ok = /^[a-z][a-z0-9-]*-[a-z0-9-]+$/.test(name);

	if (!ok) {
		throw new Error(
			`[ION::COMPONENT] Invalid tag name: ${name}. ` +
			`Tag must be in the format of x-<name>.`,
		);
	}
}

/**
 * Converts a string to kebab-case.
 * 
 * @param s The string to convert.
 * @returns The kebab-cased string.
 * 
 * ---
 * @example
 * toKebabCase("userName"); // "user-name"
 * toKebabCase("USERName"); // "user-name"
 * 
 * @see {@link assertValidTag | assertValidTag}
 */
export const toKebabCase = (s: string) => s
	.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
	.replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
	.toLowerCase();

export function escapeHtml(s: string) {
	return (s ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}