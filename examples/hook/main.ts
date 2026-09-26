import {
	on,
	property,
	query
} from "@gottheflag/ion/decorators";
import {
	Component,
	Ion
} from "@gottheflag/ion";
import { html } from "@gottheflag/ion/template";
import {
	hok,
	makeId,
	type Id,
	type Name
} from "@gottheflag/ion/hook";

@Ion.create("x-sample")
export class Sample extends Component {
	@property({
		attribute: "value",
		render: true
	})
	name = "xyz";

	protected render() {
		return html`
			<h1>Sample</h1>
			<p>Hello, ${this.name}!</p>
		`;
	}
}

@Ion.create("x-hooking")
export class Hooky extends Component {
	static styles = `
		${super.styles}
		:host {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}

		div {
			display: flex;
			flex-direction: row;
			gap: 0.25rem;
		}

		.worker {
			display: flex;
			flex-direction: row;
			gap: 0.25rem;
			width: 100%;
		}

		.worker input {
			flex: 1;
			padding: 0.5rem;
		}
	`;

	private hooks:
		Array<[ Id, Name ]> = [];

	@query("#hookId")
	hookId!: HTMLInputElement;

	@query("#newHookId")
	newHookId!: HTMLInputElement;

	@query("#hookName")
	hookName!: HTMLSelectElement;

	@query("#existingHooks")
	existingHooks!: HTMLSelectElement;

	@on("click", "#add")
	protected addHook() {
		const id =
			this.newHookId.value ||
			makeId();

		if (
			id &&
			this.hooks.some(
				hook =>
					hook[0] === id
			)
		) return;

		this.hooks.push([
			id,
			this.hookName.value as Name
		]);

		this.newHookId.value = "";

		this.existingHooks.innerHTML =
			this.hooks
				.map(
					([ hookId, name ]) => `
						<option value="${String(hookId)}">${name}</option>
					`
				)
				.join("");
	}

	@on("click", "#remove")
	protected removeHook() {
		const id =
			this.existingHooks.value;

		if (
			!id ||
			!this.hooks.some(
				hook =>
					hook[0] === id
			)
		) return;

		this.hooks =
			this.hooks.filter(
				hook =>
					hook[0] !== id
			);

		Array.from(
			this.existingHooks.options
		).forEach(
			(option, idx) => {
				if (
					option.value === id
				) {
					this.existingHooks
						.remove(idx);
				}
			}
		);
	}

	@on("click", "#sample")
	protected sample() {
		document
			.querySelector("x-sample")
			?.remove();

		const sample =
			document.createElement(
				"x-sample"
			) as Sample;

		this.hooks.forEach(
			([ id, name ]) => {
				if (hok.has(id)) {
					return;
				}

				hok.for(
					sample.constructor,
					name,
					(host: any) => {
						console.log(
							`[${name}]`,
							host
						);
					},
					id
				);
			}
		);

		document.body
			.appendChild(sample);
	}

	@on("click", "#get")
	protected get() {
		const lookup =
			this.hookId.value;

		const hook =
			this.hooks.find(
				([ id ]) =>
					id === lookup
			);

		if (!hook) return;

		this.existingHooks.value =
			String(hook[0]);
	}

	protected render() {
		return html`
			<div class="worker">
				<input id="hookId" type="text" placeholder="id">
				<button type="button" id="get">Get</button>
			</div>
			<div>
				<input id="newHookId" type="text" placeholder="id">
				<select id="hookName">
					<optgroup label="before">
						<option value="before:define">define</option>
						<option value="before:init">init</option>
						<option value="before:create">create</option>
						<option value="before:render">render</option>
						<option value="before:ready">ready</option>
						<option value="before:remove">remove</option>
						<option value="before:attribute:change">attribute:change</option>
						<option value="before:adopted">adopted</option>
						<option value="before:event:emit">event:emit</option>
						<option value="before:plugin:install">plugin:install</option>
					</optgroup>
					<optgroup label="after">
						<option value="after:define">define</option>
						<option value="after:init">init</option>
						<option value="after:create">create</option>
						<option value="after:render">render</option>
						<option value="after:ready">ready</option>
						<option value="after:remove">remove</option>
						<option value="after:attribute:change">attribute:change</option>
						<option value="after:adopted">adopted</option>
						<option value="after:event:emit">event:emit</option>
						<option value="after:plugin:install">plugin:install</option>
					</optgroup>
				</select>
				<button type="button" id="add">Add</button>
				<button type="button" id="sample">Sample</button>
			</div>
			<div>
				<select id="existingHooks"></select>
				<button type="button" id="remove">Remove</button>
			</div>
		`;
	}
}
