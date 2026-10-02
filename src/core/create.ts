import {
	type Options,
	OPTIONS as OPTIONS_KEY
} from "./options.js";

import { run as runHook } from "../hook/hook.js";
import { assertValidTag } from "../utils.js";

const hasOwn =
	Object.prototype.hasOwnProperty;

function defineComponent<
	T extends CustomElementConstructor
>(
	ctor: T,
	name: string,
	options?: Options
): T {
	assertValidTag(name);

	const form =
		options?.form === true;

	if (
		form &&
		options?.extends
	) {
		throw new TypeError(
			"[ION::FORM] form: true is only supported for autonomous custom elements because customized built-ins cannot use attachInternals()."
		);
	}

	if (
		form &&
		typeof HTMLElement.prototype
			.attachInternals !== "function"
	) {
		throw new Error(
			"[ION::FORM] Form-associated custom elements are not supported in this browser."
		);
	}

	const existing =
		customElements.get(name);

	if (existing) {
		if (existing !== ctor) {
			throw new Error(
				`[ION::COMPONENT] <${name}> is already defined with a different constructor.`
			);
		}

		return ctor;
	}

	const normalizedOptions =
		options
			? {
				...options,
				form
			}
			: undefined;

	(ctor as any)[ OPTIONS_KEY ] =
		normalizedOptions;

	const inheritedForm =
		(ctor as any).formAssociated === true;

	if (
		form ||
		inheritedForm ||
		hasOwn.call(
			ctor,
			"formAssociated"
		)
	) {
		Object.defineProperty(
			ctor,
			"formAssociated",
			{
				value: form,
				writable: true,
				configurable: true
			}
		);
	}

	runHook(
		ctor,
		"before:define",
		name
	);

	customElements.define(
		name,
		ctor,
		{
			extends:
				normalizedOptions
					?.extends
		}
	);

	runHook(
		ctor,
		"after:define",
		name
	);

	return ctor;
}

/**
 * Ion public runtime API.
 */
export class Ion {
	private constructor() { }

	static create<
		T extends CustomElementConstructor
	>(
		ctor: T,
		name: string,
		options?: Options
	): T;

	static create(
		name: string,
		options?: Options
	): <
		T extends CustomElementConstructor
	>(
		ctor: T
	) => T;

	static create<
		T extends CustomElementConstructor
	>(
		ctorOrName: T | string,
		nameOrOptions?:
			| string
			| Options,
		options?: Options
	):
		| T
		| ((ctor: T) => T) {
		if (
			typeof ctorOrName ===
			"string"
		) {
			const name =
				ctorOrName;

			const decoratorOptions =
				nameOrOptions as
					| Options
					| undefined;

			return (
				ctor: T
			): T =>
				defineComponent(
					ctor,
					name,
					decoratorOptions
				);
		}

		if (
			typeof nameOrOptions !==
			"string"
		) {
			throw new TypeError(
				"[ION::COMPONENT] Component name is required."
			);
		}

		return defineComponent(
			ctorOrName,
			nameOrOptions,
			options
		);
	}
}
