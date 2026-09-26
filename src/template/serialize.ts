import type { Result } from "./types.js";
import { escapeHtml } from "../utils.js";

export function serialize(result: Result): string {
	let output = "";

	for (let i = 0; i < result.strings.length; i++) {
		output += result.strings[ i ];

		if (i < result.values.length) {
			output += serializeValue(result.values[ i ]);
		}
	}

	return output;
}

function serializeValue(value: unknown): string {
	if (value == null || typeof value === "boolean") {
		return "";
	}

	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "bigint"
	) {
		return escapeHtml(String(value));
	}

	if (Array.isArray(value)) {
		return value
			.map(serializeValue)
			.join("");
	}

	if (isResult(value)) {
		return serialize(value);
	}

	throw new TypeError(
		`[ION::TEMPLATE] Unsupported interpolation value: ${describeValue(value)}`
	);
}

function isResult(value: unknown): value is Result {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const candidate = value as Partial<Result>;

	return (
		Array.isArray(candidate.strings) &&
		Array.isArray(candidate.values)
	);
}

function describeValue(value: unknown): string {
	if (typeof value === "function") return "function";
	if (typeof value === "symbol") return "symbol";

	return Object.prototype.toString.call(value);
}