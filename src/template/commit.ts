import { reconcile } from "./reconcile.js";
import { serialize } from "./serialize.js";
import type { Result } from "./types.js";

export function commit(
	result: Result,
	root: ShadowRoot
): void {
	/**
	 * By using `ownerDocument` here, we create the template in the same
	 * document as the root, which is important for the reconciliation
	 * algorithm to work correctly.
	 * 
	 * ---
	 * 
	 * #### Example:
	 * root = the shadow root \
	 * ownerDocument = the document that contains the shadow root.. \
	 *   can be an `iframe` or `document` depending on the context.
	 */
	const template = root.ownerDocument.createElement("template");

	template.innerHTML = serialize(result);

	reconcile(root, template.content);
}