import type {
	Result,
	TemplateValue
} from "./types.js";

export function html(
	strings: TemplateStringsArray,
	...values: TemplateValue[]
): Result {
	return {
		strings,
		values
	};
}