import {
	afterEach,
	expect,
	test,
	vi
} from "vitest";

import {
	Component,
	Ion,
	type FormRestoreMode,
	type FormState
} from "../src/index.js";

import {
	property,
	state
} from "../src/decorators/index.js";

import { html } from "../src/template/index.js";
import { hok } from "../src/hook/index.js";

function availableTag(
	base: string
): string {
	let tag = base;
	let index = 0;

	while (customElements.get(tag)) {
		tag = `${base}-${++index}`;
	}

	return tag;
}

function mountInForm<T extends HTMLElement>(
	tag: string,
	name = "field"
): {
	form: HTMLFormElement;
	element: T;
} {
	const form =
		document.createElement("form");

	const element =
		document.createElement(tag) as T;

	element.setAttribute(
		"name",
		name
	);

	form.append(element);
	document.body.append(form);

	return {
		form,
		element
	};
}

function submitted(
	form: HTMLFormElement,
	name = "field"
): FormDataEntryValue | null {
	return new FormData(form)
		.get(name);
}

afterEach(() => {
	document.body.replaceChildren();
});

test("form: true marks the constructor and participates in FormData", () => {
	class FormComponent
		extends Component {
		@property()
		value = "ready";
	}

	const tag =
		availableTag(
			"ion-test-form-associated"
		);

	Ion.create(
		FormComponent,
		tag,
		{
			form: true
		}
	);

	expect(
		(FormComponent as typeof FormComponent & {
			formAssociated: boolean;
		}).formAssociated
	).toBe(true);

	const { form, element } =
		mountInForm<FormComponent>(tag);

	expect(element.hasFormControl)
		.toBe(true);

	expect(submitted(form))
		.toBe("ready");
});

test("non-form components reject the form-control API without reserving .form", () => {
	class PlainComponent
		extends Component {
		readOwner() {
			return this.formControl.owner;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-disabled"
		);

	Ion.create(
		PlainComponent,
		tag
	);

	const element =
		document.createElement(tag) as PlainComponent;

	expect("form" in element)
		.toBe(false);

	expect(element.hasFormControl)
		.toBe(false);

	expect(() =>
		element.readOwner()
	).toThrow(
		"[ION::FORM] This component is not form-associated. Register it with { form: true }."
	);
});

test("synchronizes the initial value synchronously on connection", () => {
	class ValueComponent
		extends Component {
		@property()
		value = "initial";
	}

	const tag =
		availableTag(
			"ion-test-form-sync-initial"
		);

	Ion.create(
		ValueComponent,
		tag,
		{
			form: true
		}
	);

	const { form } =
		mountInForm<ValueComponent>(tag);

	expect(submitted(form))
		.toBe("initial");
});

test("synchronizes property changes without a second developer call", () => {
	class ValueComponent
		extends Component {
		@property()
		value = "first";

		setValue(value: string) {
			this.value = value;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-property-sync"
		);

	Ion.create(
		ValueComponent,
		tag,
		{
			form: true
		}
	);

	const { form, element } =
		mountInForm<ValueComponent>(tag);

	element.setValue("second");

	expect(submitted(form))
		.toBe("second");
});

test("rendering properties synchronize once per change", () => {
	class ValueComponent
		extends Component {
		@property()
		value = "first";

		setValue(value: string) {
			this.value = value;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-single-sync"
		);

	Ion.create(
		ValueComponent,
		tag,
		{
			form: true
		}
	);

	const spy = vi.spyOn(
		ElementInternals.prototype,
		"setFormValue"
	);

	try {
		const { element } =
			mountInForm<ValueComponent>(tag);

		spy.mockClear();
		element.setValue("second");

		expect(spy).toHaveBeenCalledTimes(1);
	} finally {
		spy.mockRestore();
	}
});

test("synchronizes render:false properties immediately", () => {
	class StaticValue
		extends Component {
		@property({
			reflect: false,
			render: false
		})
		value = "first";

		setValue(value: string) {
			this.value = value;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-static-property"
		);

	Ion.create(
		StaticValue,
		tag,
		{
			form: true
		}
	);

	const { form, element } =
		mountInForm<StaticValue>(tag);

	element.setValue("second");

	expect(submitted(form))
		.toBe("second");
});

test("computed formValue synchronizes after each independent state change", () => {
	class DateTimeComponent
		extends Component {
		@state
		private local =
			"2026-09-28T12:00";

		@state
		private timezone =
			"+03:00";

		protected override get formValue() {
			return `${this.local}${this.timezone}`;
		}

		setLocal(local: string) {
			this.local = local;
		}

		setTimezone(timezone: string) {
			this.timezone = timezone;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-computed"
		);

	Ion.create(
		DateTimeComponent,
		tag,
		{
			form: true
		}
	);

	const { form, element } =
		mountInForm<DateTimeComponent>(tag);

	element.setLocal(
		"2026-10-01T08:30"
	);

	expect(submitted(form))
		.toBe(
			"2026-10-01T08:30+03:00"
		);

	element.setTimezone(
		"+00:00"
	);

	expect(submitted(form))
		.toBe(
			"2026-10-01T08:30+00:00"
		);
});

test("an overridden formValue takes precedence over value", () => {
	class SignatureComponent
		extends Component {
		@property()
		value = "preview";

		@property()
		signature = "signed:a";

		protected override get formValue() {
			return this.signature;
		}

		setSignature(signature: string) {
			this.signature = signature;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-override"
		);

	Ion.create(
		SignatureComponent,
		tag,
		{
			form: true
		}
	);

	const { form, element } =
		mountInForm<SignatureComponent>(tag);

	expect(submitted(form))
		.toBe("signed:a");

	element.setSignature("signed:b");

	expect(submitted(form))
		.toBe("signed:b");
});

test("normalizes overridden numeric formValue using the same automatic rules", () => {
	class NumberComponent
		extends Component {
		protected override get formValue() {
			return 42;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-override-number"
		);

	Ion.create(
		NumberComponent,
		tag,
		{
			form: true
		}
	);

	const { form } =
		mountInForm<NumberComponent>(tag);

	expect(submitted(form))
		.toBe("42");
});

test("a component without value submits nothing by default", () => {
	class EmptyComponent
		extends Component { }

	const tag =
		availableTag(
			"ion-test-form-empty"
		);

	Ion.create(
		EmptyComponent,
		tag,
		{
			form: true
		}
	);

	const { form } =
		mountInForm<EmptyComponent>(tag);

	expect(
		new FormData(form)
			.has("field")
	).toBe(false);
});

test("normalizes automatic scalar values strictly", () => {
	class ScalarComponent
		extends Component {
		@property({
			reflect: false,
			render: false
		})
		value: unknown = "safe";

		setValue(value: unknown) {
			this.value = value;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-scalars"
		);

	Ion.create(
		ScalarComponent,
		tag,
		{
			form: true
		}
	);

	const { form, element } =
		mountInForm<ScalarComponent>(tag);

	for (const [ value, expected ] of [
		[ "", "" ],
		[ 0, "0" ],
		[ 10n, "10" ]
	] as const) {
		element.setValue(value);
		expect(submitted(form))
			.toBe(expected);
	}

	for (const value of [
		null,
		undefined
	]) {
		element.setValue(value);
		expect(
			new FormData(form)
				.has("field")
		).toBe(false);
	}
});

test("rejects non-standard automatic serialization", () => {
	class UnsafeValue
		extends Component {
		@property({
			reflect: false,
			render: false
		})
		value: unknown = "safe";

		setValue(value: unknown) {
			this.value = value;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-unsupported-value"
		);

	Ion.create(
		UnsafeValue,
		tag,
		{
			form: true
		}
	);

	const { element } =
		mountInForm<UnsafeValue>(tag);

	const invalid = [
		true,
		Symbol("x"),
		new Date(),
		{},
		new Blob([ "x" ]),
		NaN,
		Infinity,
		{
			[ Symbol.toStringTag ]: "File"
		},
		{
			[ Symbol.toStringTag ]: "FormData"
		}
	];

	for (const value of invalid) {
		element.setValue("safe");

		expect(() =>
			element.setValue(value)
		).toThrow(
			"[ION::FORM] formValue must resolve to a string, finite number, bigint, File, FormData, null, or undefined. Serialize other values explicitly."
		);
	}
});

test("a throwing formValue cannot prevent created() or the queued render", async () => {
	class ThrowingComponent
		extends Component {
		createdCount = 0;
		renderCount = 0;
		throwOnce = true;

		protected override get formValue() {
			if (this.throwOnce) {
				this.throwOnce = false;
				throw new Error("formValue exploded");
			}

			return "recovered";
		}

		protected override created() {
			this.createdCount++;
		}

		protected override render() {
			this.renderCount++;
			return html`<span>rendered</span>`;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-throw-connect"
		);

	Ion.create(
		ThrowingComponent,
		tag,
		{
			form: true
		}
	);

	const errors: Error[] = [];
	const handleError = (
		event: ErrorEvent
	) => {
		if (
			event.error instanceof Error &&
			event.error.message ===
				"formValue exploded"
		) {
			event.preventDefault();
			errors.push(event.error);
		}
	};

	window.addEventListener(
		"error",
		handleError
	);

	const form =
		document.createElement("form");

	const element =
		document.createElement(tag) as ThrowingComponent;

	element.setAttribute("name", "field");
	form.append(element);
	document.body.append(form);

	await Promise.resolve();

	window.removeEventListener(
		"error",
		handleError
	);

	expect(errors).toHaveLength(1);
	expect(element.createdCount).toBe(1);
	expect(element.renderCount).toBe(1);
	expect(
		element.shadowRoot
			?.textContent
	).toContain("rendered");
});

test("queues a render before a later reactive formValue error escapes", async () => {
	class ThrowingUpdate
		extends Component {
		@state
		private value = "first";

		renderCount = 0;

		protected override get formValue() {
			if (this.value === "bad") {
				throw new Error("bad reactive value");
			}

			return this.value;
		}

		setBad() {
			this.value = "bad";
		}

		protected override render() {
			this.renderCount++;
			return html`<span>${this.value}</span>`;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-throw-update"
		);

	Ion.create(
		ThrowingUpdate,
		tag,
		{
			form: true
		}
	);

	const { element } =
		mountInForm<ThrowingUpdate>(tag);

	await Promise.resolve();
	const before = element.renderCount;

	expect(() =>
		element.setBad()
	).toThrow("bad reactive value");

	await Promise.resolve();

	expect(element.renderCount)
		.toBe(before + 1);
});

test("same-tick moves resynchronize detached state and render", async () => {
	class MoveComponent
		extends Component {
		@state
		private value = "first";

		renderCount = 0;

		setValue(value: string) {
			this.value = value;
		}

		protected override render() {
			this.renderCount++;
			return html`<span>${this.value}</span>`;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-same-tick-move"
		);

	Ion.create(
		MoveComponent,
		tag,
		{
			form: true
		}
	);

	const first =
		document.createElement("form");

	const second =
		document.createElement("form");

	const element =
		document.createElement(tag) as MoveComponent;

	element.setAttribute("name", "field");
	first.append(element);
	document.body.append(first, second);

	await Promise.resolve();
	const before = element.renderCount;

	element.remove();
	element.setValue("second");
	second.append(element);

	expect(submitted(second))
		.toBe("second");

	await Promise.resolve();

	expect(element.renderCount)
		.toBe(before + 1);

	expect(
		element.shadowRoot
			?.textContent
	).toContain("second");
});

test("real disconnects resynchronize detached state on reconnect", async () => {
	class ReconnectComponent
		extends Component {
		@state
		value = "first";

		setValue(value: string) {
			this.value = value;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-reconnect"
		);

	Ion.create(
		ReconnectComponent,
		tag,
		{
			form: true
		}
	);

	const { form, element } =
		mountInForm<ReconnectComponent>(tag);

	element.remove();
	await Promise.resolve();

	element.setValue("detached");
	form.append(element);

	expect(submitted(form))
		.toBe("detached");
});

test("manual setValue is one-off and automatic synchronization remains authoritative", () => {
	class ManualComponent
		extends Component {
		@property()
		value = "automatic";

		setManual(value: string) {
			this.formControl.setValue(value);
		}

		setAutomatic(value: string) {
			this.value = value;
		}

		syncAgain() {
			this.requestRender();
		}
	}

	const tag =
		availableTag(
			"ion-test-form-manual"
		);

	Ion.create(
		ManualComponent,
		tag,
		{
			form: true
		}
	);

	const { form, element } =
		mountInForm<ManualComponent>(tag);

	element.setManual("manual");
	expect(submitted(form)).toBe("manual");

	// Same-value assignments are intentionally no-ops.
	element.setAutomatic("automatic");
	expect(submitted(form)).toBe("manual");

	element.syncAgain();
	expect(submitted(form)).toBe("automatic");

	element.setManual("manual-again");
	element.setAutomatic("next");
	expect(submitted(form)).toBe("next");
});

test("formValue can return FormData for persistent multi-entry submissions", () => {
	class RangeComponent
		extends Component {
		@state
		private start =
			"2026-10-01";

		@state
		private end =
			"2026-10-08";

		protected override get formValue() {
			const value =
				new FormData();

			value.set(
				"start",
				this.start
			);

			value.set(
				"end",
				this.end
			);

			return value;
		}

		setRange(
			start: string,
			end: string
		) {
			this.start = start;
			this.end = end;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-data-auto"
		);

	Ion.create(
		RangeComponent,
		tag,
		{
			form: true
		}
	);

	const { form, element } =
		mountInForm<RangeComponent>(tag);

	let data =
		new FormData(form);

	expect(data.get("start"))
		.toBe("2026-10-01");

	expect(data.get("end"))
		.toBe("2026-10-08");

	element.setRange(
		"2026-11-01",
		"2026-11-09"
	);

	data = new FormData(form);

	expect(data.get("start"))
		.toBe("2026-11-01");

	expect(data.get("end"))
		.toBe("2026-11-09");
});

test("setValue accepts FormData and an explicit restore state", () => {
	class RangeComponent
		extends Component {
		setRange(
			start: string,
			end: string
		) {
			const value =
				new FormData();

			value.set("start", start);
			value.set("end", end);

			this.formControl.setValue(
				value,
				"range-v1"
			);
		}
	}

	const tag =
		availableTag(
			"ion-test-form-data"
		);

	Ion.create(
		RangeComponent,
		tag,
		{
			form: true
		}
	);

	const { form, element } =
		mountInForm<RangeComponent>(tag);

	const spy = vi.spyOn(
		ElementInternals.prototype,
		"setFormValue"
	);

	try {
		spy.mockClear();

		element.setRange(
			"2026-10-01",
			"2026-10-08"
		);

		expect(spy)
			.toHaveBeenCalledTimes(1);

		const [ value, state ] =
			spy.mock.calls[0]!;

		expect(value)
			.toBeInstanceOf(FormData);

		expect(state)
			.toBe("range-v1");
	} finally {
		spy.mockRestore();
	}

	const data =
		new FormData(form);

	expect(data.get("start"))
		.toBe("2026-10-01");

	expect(data.get("end"))
		.toBe("2026-10-08");
});

test("form reset restores the first-connect writable value before formReset", () => {
	class ResetComponent
		extends Component {
		@property()
		value = "default";

		seenDuringReset = "";

		setValue(value: string) {
			this.value = value;
		}

		protected override formReset() {
			this.seenDuringReset =
				this.value;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-reset"
		);

	Ion.create(
		ResetComponent,
		tag,
		{
			form: true
		}
	);

	const { form, element } =
		mountInForm<ResetComponent>(tag);

	element.setValue("changed");
	form.reset();

	expect(element.value)
		.toBe("default");

	expect(element.seenDuringReset)
		.toBe("default");

	expect(submitted(form))
		.toBe("default");
});

test("default reset ignores getter-only value and still runs formReset", () => {
	class ComputedReset
		extends Component {
		#value = "computed";
		#created = false;
		createdCount = 0;
		resetCount = 0;

		get value() {
			if (!this.#created) {
				throw new Error(
					"value read before created"
				);
			}

			return this.#value;
		}

		protected override created() {
			this.#created = true;
			this.createdCount++;
		}

		protected override formReset() {
			this.resetCount++;
			this.#value = "reset";
		}
	}

	const tag =
		availableTag(
			"ion-test-form-getter-reset"
		);

	Ion.create(
		ComputedReset,
		tag,
		{
			form: true
		}
	);

	let mounted:
		| ReturnType<typeof mountInForm<ComputedReset>>
		| undefined;

	expect(() => {
		mounted =
			mountInForm<ComputedReset>(tag);
	}).not.toThrow();

	if (!mounted) {
		throw new Error(
			"Expected form component to mount."
		);
	}

	const { form, element } = mounted;

	expect(element.createdCount)
		.toBe(1);

	expect(() => form.reset())
		.not.toThrow();

	expect(element.resetCount)
		.toBe(1);

	expect(submitted(form))
		.toBe("reset");
});

test("default capture is attempted once and does not adopt a later drifted value", async () => {
	class LateValue
		extends Component {
		installValue(value: string) {
			Object.defineProperty(
				this,
				"value",
				{
					value,
					writable: true,
					configurable: true
				}
			);
		}
	}

	const tag =
		availableTag(
			"ion-test-form-late-value"
		);

	Ion.create(
		LateValue,
		tag,
		{
			form: true
		}
	);

	const { form, element } =
		mountInForm<LateValue>(tag);

	element.remove();
	await Promise.resolve();

	element.installValue("later");
	form.append(element);

	(element as LateValue & {
		value: string;
	}).value = "changed";

	form.reset();

	expect(
		(element as LateValue & {
			value: string;
		}).value
	).toBe("changed");
});

test("upgrade-after-parse participates in forms and captures the parsed value", () => {
	const tag =
		availableTag(
			"ion-test-form-upgrade"
		);

	const form =
		document.createElement("form");

	form.innerHTML =
		`<${tag} name="field" value="3"></${tag}>`;

	document.body.append(form);

	class UpgradeComponent
		extends Component {
		@property({
			type: Number
		})
		value = 0;

		setValue(value: number) {
			this.value = value;
		}
	}

	Ion.create(
		UpgradeComponent,
		tag,
		{
			form: true
		}
	);

	const element =
		form.querySelector(tag) as UpgradeComponent;

	expect(submitted(form))
		.toBe("3");

	expect(
		element.formControl.owner
	).toBe(form);

	element.setValue(8);
	form.reset();

	expect(element.value).toBe(3);
	expect(submitted(form)).toBe("3");
});

test("exposes the owning form and associated labels", () => {
	class AssociatedComponent
		extends Component {
		@property()
		value = "x";

		owner() {
			return this.formControl.owner;
		}

		labels() {
			return this.formControl.labels;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-owner"
		);

	Ion.create(
		AssociatedComponent,
		tag,
		{
			form: true
		}
	);

	const form =
		document.createElement("form");

	const label =
		document.createElement("label");

	const element =
		document.createElement(tag) as AssociatedComponent;

	element.id = "associated-control";
	element.setAttribute("name", "field");
	label.htmlFor = element.id;
	label.textContent = "Control";

	form.append(label, element);
	document.body.append(form);

	expect(element.owner())
		.toBe(form);

	expect(
		form.elements.namedItem(
			"field"
		)
	).toBe(element);

	expect(
		Array.from(element.labels())
	).toContain(label);
});

test("uses native validity, invalid events, and reporting", () => {
	class ValidityComponent
		extends Component {
		@property()
		value = "x";

		invalidate() {
			this.formControl.setValidity(
				{
					customError: true
				},
				"Invalid value."
			);
		}

		clear() {
			this.formControl.clearValidity();
		}

		message() {
			return this.formControl.validationMessage;
		}

		valid() {
			return this.formControl.validity.valid;
		}

		report() {
			return this.formControl.reportValidity();
		}

		invalidWithoutMessage() {
			// @ts-expect-error invalid flags require a message
			this.formControl.setValidity({
				customError: true
			});
		}
	}

	const tag =
		availableTag(
			"ion-test-form-validity"
		);

	Ion.create(
		ValidityComponent,
		tag,
		{
			form: true
		}
	);

	const { form, element } =
		mountInForm<ValidityComponent>(tag);

	element.tabIndex = 0;

	let invalidCount = 0;
	element.addEventListener(
		"invalid",
		() => {
			invalidCount++;
		}
	);

	element.invalidate();

	expect(element.valid()).toBe(false);
	expect(element.message()).toBe("Invalid value.");
	expect(form.checkValidity()).toBe(false);
	expect(element.report()).toBe(false);
	expect(invalidCount).toBeGreaterThan(0);

	expect(() =>
		element.invalidWithoutMessage()
	).toThrow(TypeError);

	element.clear();

	expect(element.valid()).toBe(true);
	expect(form.checkValidity()).toBe(true);
});

test("forwards native association and disabled state", async () => {
	class CallbackComponent
		extends Component {
		@property()
		value = "x";

		associatedWith:
			HTMLFormElement | null = null;

		disabledState = false;

		protected override formAssociated(
			form: HTMLFormElement | null
		) {
			this.associatedWith = form;
		}

		protected override formDisabled(
			disabled: boolean
		) {
			this.disabledState = disabled;
		}

		willValidate() {
			return this.formControl.willValidate;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-callbacks"
		);

	Ion.create(
		CallbackComponent,
		tag,
		{
			form: true
		}
	);

	const form =
		document.createElement("form");

	const fieldset =
		document.createElement("fieldset");

	const element =
		document.createElement(tag) as CallbackComponent;

	element.setAttribute("name", "field");
	fieldset.append(element);
	form.append(fieldset);
	document.body.append(form);

	expect(element.associatedWith).toBe(form);
	expect(submitted(form)).toBe("x");

	fieldset.disabled = true;
	await Promise.resolve();

	expect(element.disabledState).toBe(true);
	expect(element.willValidate()).toBe(false);
	expect(new FormData(form).has("field")).toBe(false);

	fieldset.disabled = false;
	element.setAttribute("disabled", "");
	await Promise.resolve();

	expect(element.disabledState).toBe(true);
	expect(new FormData(form).has("field")).toBe(false);

	element.removeAttribute("disabled");
	await Promise.resolve();

	expect(element.disabledState).toBe(false);
	expect(submitted(form)).toBe("x");
});

test("form association does not leak through inheritance", () => {
	class FormBase
		extends Component {
		@property()
		value = "base";
	}

	const baseTag =
		availableTag(
			"ion-test-form-base"
		);

	Ion.create(
		FormBase,
		baseTag,
		{
			form: true
		}
	);

	class PlainChild
		extends FormBase {
		readOwner() {
			return this.formControl.owner;
		}
	}

	const childTag =
		availableTag(
			"ion-test-form-child"
		);

	Ion.create(
		PlainChild,
		childTag
	);

	expect(
		(PlainChild as typeof PlainChild & {
			formAssociated: boolean;
		}).formAssociated
	).toBe(false);

	const plainForm =
		document.createElement("form");

	const child =
		document.createElement(childTag) as PlainChild;

	child.setAttribute("name", "field");
	plainForm.append(child);
	document.body.append(plainForm);

	expect(
		plainForm.elements.namedItem("field")
	).toBeNull();

	expect(
		new FormData(plainForm)
			.has("field")
	).toBe(false);

	expect(() =>
		child.readOwner()
	).toThrow(
		"[ION::FORM] This component is not form-associated. Register it with { form: true }."
	);

	const baseForm =
		document.createElement("form");

	const base =
		document.createElement(baseTag);

	base.setAttribute("name", "field");
	baseForm.append(base);
	document.body.append(baseForm);

	expect(submitted(baseForm))
		.toBe("base");
});

test("a child can opt into forms under a plain parent", () => {
	class PlainBase
		extends Component { }

	class FormChild
		extends PlainBase {
		@property()
		value = "child";
	}

	const tag =
		availableTag(
			"ion-test-form-child-opt-in"
		);

	Ion.create(
		FormChild,
		tag,
		{
			form: true
		}
	);

	const { form } =
		mountInForm<FormChild>(tag);

	expect(submitted(form)).toBe("child");
});

test("only literal form: true enables native form association", () => {
	class RuntimeComponent
		extends Component { }

	const tag =
		availableTag(
			"ion-test-form-runtime-flag"
		);

	Ion.create(
		RuntimeComponent,
		tag,
		{
			form: 1
		} as unknown as {
			form: boolean;
		}
	);

	expect(
		(RuntimeComponent as typeof RuntimeComponent & {
			formAssociated?: boolean;
		}).formAssociated
	).not.toBe(true);

	const element =
		document.createElement(tag) as RuntimeComponent;

	expect(() =>
		element.formControl
	).toThrow(
		"[ION::FORM] This component is not form-associated. Register it with { form: true }."
	);
});

test("formAssociated registration marker stays writable for subclasses", () => {
	class WritableComponent
		extends Component { }

	const tag =
		availableTag(
			"ion-test-form-writable-static"
		);

	Ion.create(
		WritableComponent,
		tag,
		{
			form: true
		}
	);

	const descriptor =
		Object.getOwnPropertyDescriptor(
			WritableComponent,
			"formAssociated"
		);

	expect(descriptor?.writable)
		.toBe(true);
});

test("rejects form association on customized built-ins", () => {
	class ExtendedComponent
		extends Component { }

	const tag =
		availableTag(
			"ion-test-form-extended"
		);

	expect(() =>
		Ion.create(
			ExtendedComponent,
			tag,
			{
				form: true,
				extends: "input"
			}
		)
	).toThrow(
		"[ION::FORM] form: true is only supported for autonomous custom elements because customized built-ins cannot use attachInternals()."
	);

	expect(
		customElements.get(tag)
	).toBeUndefined();
});

test("supports native external form association through the form attribute", () => {
	class ExternalComponent
		extends Component {
		@property()
		value = "external";

		owner() {
			return this.formControl.owner;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-external"
		);

	Ion.create(
		ExternalComponent,
		tag,
		{
			form: true
		}
	);

	const form =
		document.createElement("form");

	form.id = "external-owner";

	const element =
		document.createElement(tag) as ExternalComponent;

	element.setAttribute("name", "field");
	element.setAttribute("form", form.id);

	document.body.append(form, element);

	expect(element.owner()).toBe(form);
	expect(submitted(form)).toBe("external");
});

test("passes File values through @property without attribute reflection", () => {
	class FileComponent
		extends Component {
		@property({
			reflect: false
		})
		value: File =
			new File(
				[ "payload" ],
				"evidence.txt",
				{
					type: "text/plain"
				}
			);
	}

	const tag =
		availableTag(
			"ion-test-form-file"
		);

	Ion.create(
		FileComponent,
		tag,
		{
			form: true
		}
	);

	const { form } =
		mountInForm<FileComponent>(tag);

	const value = submitted(form);

	expect(value).toBeInstanceOf(File);
	expect((value as File).name)
		.toBe("evidence.txt");
});

test("accepts a cross-realm File using WebIDL brand checks", () => {
	const iframe =
		document.createElement("iframe");

	document.body.append(iframe);

	try {
		const ForeignFile =
			(
				iframe.contentWindow as
					Window & typeof globalThis
			).File;

		const file =
			new ForeignFile(
				[ "payload" ],
				"foreign.txt",
				{
					type: "text/plain"
				}
			);

		class ForeignFileComponent
			extends Component {
			@property({
				reflect: false,
				render: false
			})
			value: unknown = null;

			setFile(value: File) {
				this.value = value;
			}
		}

		const tag =
			availableTag(
				"ion-test-form-foreign-file"
			);

		Ion.create(
			ForeignFileComponent,
			tag,
			{
				form: true
			}
		);

		const { form, element } =
			mountInForm<ForeignFileComponent>(tag);

		element.setFile(file);

		const value = submitted(form);

		expect(value).not.toBeNull();
		expect((value as File).name)
			.toBe("foreign.txt");
	} finally {
		iframe.remove();
	}
});

test("adoption into another document can synchronize afterward", () => {
	class AdoptedComponent
		extends Component {
		@property({
			reflect: false,
			render: false
		})
		value = "before";

		setValue(value: string) {
			this.value = value;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-adopted"
		);

	Ion.create(
		AdoptedComponent,
		tag,
		{
			form: true
		}
	);

	const element =
		document.createElement(tag) as AdoptedComponent;

	element.setAttribute("name", "field");
	document.body.append(element);

	const iframe =
		document.createElement("iframe");

	document.body.append(iframe);

	try {
		const target =
			iframe.contentDocument!;

		const adopted =
			target.adoptNode(element);

		const form =
			target.createElement("form");

		form.append(adopted);
		target.body.append(form);

		element.setValue("after");

		expect(submitted(form))
			.toBe("after");
	} finally {
		iframe.remove();
	}
});

test("formRestore exposes exported types and resynchronizes afterward", () => {
	class RestoreComponent
		extends Component {
		@property()
		value = "before";

		seen:
			| [ FormState, FormRestoreMode ]
			| null = null;

		protected override formRestore(
			state: FormState,
			mode: FormRestoreMode
		) {
			this.seen = [ state, mode ];
			this.formControl.setValue(
				"manual-during-restore"
			);
		}
	}

	const tag =
		availableTag(
			"ion-test-form-restore"
		);

	Ion.create(
		RestoreComponent,
		tag,
		{
			form: true
		}
	);

	const { form, element } =
		mountInForm<RestoreComponent>(tag);

	element.formStateRestoreCallback(
		"restored",
		"restore"
	);

	expect(element.seen)
		.toEqual([
			"restored",
			"restore"
		]);

	expect(submitted(form))
		.toBe("before");
});


test("formControl is available to before:init hooks", () => {
	class HookComponent
		extends Component {
		@property()
		value = "hook";
	}

	const tag =
		availableTag(
			"ion-test-form-before-init"
		);

	Ion.create(
		HookComponent,
		tag,
		{
			form: true
		}
	);

	let readable = false;
	const handle = hok.beforeFor(
		HookComponent,
		"init",
		host => {
			const component =
				host as HookComponent;

			readable =
				component.hasFormControl &&
				component.formControl.owner === null;
		}
	);

	try {
		document.createElement(tag);
		expect(readable).toBe(true);
	} finally {
		handle.off();
	}
});

test("rejects form registration when attachInternals is unavailable", () => {
	class UnsupportedComponent
		extends Component { }

	const tag =
		availableTag(
			"ion-test-form-no-internals"
		);

	const descriptor =
		Object.getOwnPropertyDescriptor(
			HTMLElement.prototype,
			"attachInternals"
		);

	if (!descriptor?.configurable) {
		throw new Error(
			"attachInternals must be configurable for this test."
		);
	}

	Object.defineProperty(
		HTMLElement.prototype,
		"attachInternals",
		{
			...descriptor,
			value: undefined
		}
	);

	try {
		expect(() =>
			Ion.create(
				UnsupportedComponent,
				tag,
				{
					form: true
				}
			)
		).toThrow(
			"[ION::FORM] Form-associated custom elements are not supported in this browser."
		);

		expect(
			customElements.get(tag)
		).toBeUndefined();
	} finally {
		Object.defineProperty(
			HTMLElement.prototype,
			"attachInternals",
			descriptor
		);
	}
});

test("accepts cross-realm FormData using WebIDL brand checks", () => {
	const iframe =
		document.createElement("iframe");

	document.body.append(iframe);

	try {
		const ForeignFormData =
			(
				iframe.contentWindow as
					Window & typeof globalThis
			).FormData;

		const value =
			new ForeignFormData();

		value.set(
			"start",
			"2026-10-01"
		);

		value.set(
			"end",
			"2026-10-08"
		);

		class ForeignFormDataComponent
			extends Component {
			@property({
				reflect: false,
				render: false
			})
			value: unknown = null;

			setValue(next: FormData) {
				this.value = next;
			}
		}

		const tag =
			availableTag(
				"ion-test-form-foreign-data"
			);

		Ion.create(
			ForeignFormDataComponent,
			tag,
			{
				form: true
			}
		);

		const { form, element } =
			mountInForm<ForeignFormDataComponent>(tag);

		element.setValue(value);

		const submittedData =
			new FormData(form);

		expect(
			submittedData.get("start")
		).toBe("2026-10-01");

		expect(
			submittedData.get("end")
		).toBe("2026-10-08");
	} finally {
		iframe.remove();
	}
});

test("automatic synchronization uses one-argument setFormValue", () => {
	class AutomaticState
		extends Component {
		@property()
		value = "first";

		setValue(value: string) {
			this.value = value;
		}
	}

	const tag =
		availableTag(
			"ion-test-form-auto-state"
		);

	Ion.create(
		AutomaticState,
		tag,
		{
			form: true
		}
	);

	const { element } =
		mountInForm<AutomaticState>(tag);

	const spy = vi.spyOn(
		ElementInternals.prototype,
		"setFormValue"
	);

	try {
		spy.mockClear();
		element.setValue("second");

		expect(spy)
			.toHaveBeenCalledTimes(1);

		expect(
			spy.mock.calls[0]
		).toEqual([ "second" ]);
	} finally {
		spy.mockRestore();
	}
});
