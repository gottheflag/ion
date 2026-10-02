import {
	Component,
	Ion
} from "@gottheflag/ion";

import {
	property,
	state
} from "@gottheflag/ion/decorators";

import {
	html
} from "@gottheflag/ion/template";

function toUtc(
	local: string,
	offset: string
): string | null {
	if (!local) return null;

	const date =
		new Date(
			`${local}:00${offset}`
		);

	return Number.isNaN(
		date.getTime()
	)
		? null
		: date.toISOString();
}

@Ion.create(
	"ion-example-datetime",
	{
		form: true
	}
)
export class DateTimeControl
	extends Component {
	@state
	private local = "";

	@state
	private offset = "+03:00";

	protected override get formValue() {
		return toUtc(
			this.local,
			this.offset
		);
	}

	protected override created() {
		this.on(
			"input",
			"#local",
			(_event: Event, target: Element) => {
				this.local =
					(target as HTMLInputElement)
						.value;
			}
		);

		this.on(
			"change",
			"#timezone",
			(_event: Event, target: Element) => {
				this.offset =
					(target as HTMLSelectElement)
						.value;
			}
		);
	}

	protected override render() {
		return html`
			<label>
				Local date/time
				<input
					id="local"
					type="datetime-local"
					value="${this.local}"
				>
			</label>

			<label>
				UTC offset
				<select id="timezone">
					<option value="+03:00">UTC+03:00</option>
					<option value="+00:00">UTC</option>
					<option value="-04:00">UTC-04:00</option>
				</select>
			</label>
		`;
	}
}

@Ion.create(
	"ion-example-rating",
	{
		form: true
	}
)
export class RatingControl
	extends Component {
	@property({
		type: Number
	})
	value = 0;

	protected override created() {
		this.on(
			"click",
			"[data-value]",
			(_event: Event, target: Element) => {
				this.value =
					Number(
						target.getAttribute(
							"data-value"
						)
					);
			}
		);
	}

	protected override render() {
		return html`
			<button type="button" data-value="1">1</button>
			<button type="button" data-value="2">2</button>
			<button type="button" data-value="3">3</button>
			<button type="button" data-value="4">4</button>
			<button type="button" data-value="5">5</button>
			<span>Selected: ${this.value}</span>
		`;
	}
}

const form =
	document.querySelector<HTMLFormElement>(
		"#example-form"
	);

const output =
	document.querySelector<HTMLElement>(
		"#output"
	);

if (!form || !output) {
	throw new Error(
		"[ION::EXAMPLE] Form example markup is missing."
	);
}

form.addEventListener(
	"submit",
	event => {
		event.preventDefault();

		const entries:
			Record<string, string> = {};

		new FormData(form)
			.forEach(
				(value, key) => {
					entries[ key ] =
						value instanceof File
							? value.name
							: value;
				}
			);

		output.textContent =
			JSON.stringify(
				entries,
				null,
				2
			);
	}
);
