export type FormValue =
	| string
	| File
	| FormData
	| null;

export type FormValueSource =
	| FormValue
	| number
	| bigint
	| undefined;

export type FormState = FormValue;

export type FormRestoreMode =
	| "restore"
	| "autocomplete";

/**
 * Native form API exposed to form-associated Ion components.
 */
export interface FormController {
	/** The owning form, or null when the component is not associated with one. */
	readonly owner: HTMLFormElement | null;

	/** Labels associated with the component. */
	readonly labels: NodeList;

	/** Native validity state for the component. */
	readonly validity: ValidityState;

	/** Native validation message for the component. */
	readonly validationMessage: string;

	/** Whether the component participates in constraint validation. */
	readonly willValidate: boolean;

	/**
	 * Explicitly set the component's submitted form value.
	 *
	 * Automatic synchronization will apply `formValue` again on the next
	 * reactive form synchronization. Override `formValue` for a persistent
	 * custom representation.
	 */
	setValue(
		value: FormValue,
		state?: FormState
	): void;

	/** Set an invalid native constraint-validation state. */
	setValidity(
		flags: ValidityStateFlags,
		message: string,
		anchor?: HTMLElement
	): void;

	/** Clear all validity flags. */
	clearValidity(): void;

	checkValidity(): boolean;
	reportValidity(): boolean;
}

type Record = {
	controller: FormControllerImpl;
	defaultCaptured: boolean;
	hasDefaultValue: boolean;
	defaultValue: unknown;
};

const RECORDS =
	new WeakMap<HTMLElement, Record>();

class FormControllerImpl
	implements FormController {
	constructor(
		private readonly internals: ElementInternals
	) { }

	get owner(): HTMLFormElement | null {
		return this.internals.form;
	}

	get labels(): NodeList {
		return this.internals.labels;
	}

	get validity(): ValidityState {
		return this.internals.validity;
	}

	get validationMessage(): string {
		return this.internals.validationMessage;
	}

	get willValidate(): boolean {
		return this.internals.willValidate;
	}

	setValue(
		value: FormValue,
		state?: FormState
	): void {
		if (state === undefined) {
			this.internals.setFormValue(value);
			return;
		}

		this.internals.setFormValue(
			value,
			state
		);
	}

	setValidity(
		flags: ValidityStateFlags,
		message: string,
		anchor?: HTMLElement
	): void {
		this.internals.setValidity(
			flags,
			message,
			anchor
		);
	}

	clearValidity(): void {
		this.internals.setValidity({});
	}

	checkValidity(): boolean {
		return this.internals.checkValidity();
	}

	reportValidity(): boolean {
		return this.internals.reportValidity();
	}
}

/** @internal */
export function attachForm(
	host: HTMLElement
): FormController {
	const existing =
		RECORDS.get(host);

	if (existing) {
		return existing.controller;
	}

	const controller =
		new FormControllerImpl(
			host.attachInternals()
		);

	RECORDS.set(
		host,
		{
			controller,
			defaultCaptured: false,
			hasDefaultValue: false,
			defaultValue: undefined
		}
	);

	return controller;
}

/** @internal */
export function syncForm(
	host: HTMLElement
): void {
	const record =
		RECORDS.get(host);

	if (!record) return;

	const value =
		(host as HTMLElement & {
			readonly formValue: unknown;
		}).formValue;

	record.controller.setValue(
		normalizeFormValue(value)
	);
}

/** @internal */
export function captureDefaultValue(
	host: HTMLElement
): void {
	const record =
		RECORDS.get(host);

	if (
		!record ||
		record.defaultCaptured
	) return;

	record.defaultCaptured = true;

	const descriptor =
		findPropertyDescriptor(
			host,
			"value"
		);

	if (
		!descriptor ||
		!canWrite(descriptor)
	) return;

	record.defaultValue =
		(host as HTMLElement & {
			value: unknown;
		}).value;

	record.hasDefaultValue = true;
}

/** @internal */
export function resetDefaultValue(
	host: HTMLElement
): void {
	const record =
		RECORDS.get(host);

	if (
		!record ||
		!record.hasDefaultValue
	) return;

	Reflect.set(
		host,
		"value",
		record.defaultValue
	);
}

/** @internal */
export function normalizeFormValue(
	value: unknown
): FormValue {
	if (value == null) return null;

	if (typeof value === "string") {
		return value;
	}

	if (typeof value === "number") {
		if (!Number.isFinite(value)) {
			throw invalidFormValue();
		}

		return String(value);
	}

	if (typeof value === "bigint") {
		return String(value);
	}

	if (isFile(value)) {
		return value;
	}

	if (isFormData(value)) {
		return value;
	}

	throw invalidFormValue();
}

function findPropertyDescriptor(
	host: object,
	key: PropertyKey
): PropertyDescriptor | undefined {
	let current: object | null = host;

	while (current) {
		const descriptor =
			Object.getOwnPropertyDescriptor(
				current,
				key
			);

		if (descriptor) {
			return descriptor;
		}

		current =
			Object.getPrototypeOf(current) as
				| object
				| null;
	}

	return undefined;
}

function canWrite(
	descriptor: PropertyDescriptor
): boolean {
	if ("value" in descriptor) {
		return descriptor.writable === true;
	}

	return typeof descriptor.set === "function";
}

function isFile(
	value: unknown
): value is File {
	if (
		typeof value !== "object" ||
		value === null ||
		typeof File === "undefined"
	) return false;

	const getter =
		Object.getOwnPropertyDescriptor(
			File.prototype,
			"name"
		)?.get;

	if (!getter) return false;

	try {
		getter.call(value);
		return true;
	} catch {
		return false;
	}
}

function isFormData(
	value: unknown
): value is FormData {
	if (
		typeof value !== "object" ||
		value === null ||
		typeof FormData === "undefined"
	) return false;

	try {
		FormData.prototype.has.call(
			value,
			"__ion_form_brand_probe__"
		);

		return true;
	} catch {
		return false;
	}
}

function invalidFormValue(): TypeError {
	return new TypeError(
		"[ION::FORM] formValue must resolve to a string, finite number, bigint, File, FormData, null, or undefined. Serialize other values explicitly."
	);
}
