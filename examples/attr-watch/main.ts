import {
	watch,
	property,
	on
} from "@gottheflag/ion/decorators";
import {
	Component,
	Ion
} from "@gottheflag/ion";
import { html } from "@gottheflag/ion/template";

@Ion.create("x-clock")
export class Clock extends Component {
	@property({
		reflect: true,
		type: Number,
		render: true
	})
	time?: number;

	log: string[] = [];

	@on("click", "#tick")
	increment() {
		this.time =
			(this.time ?? 0) + 1;
	}

	@watch("time")
	protected timeChanged(
		_old: string | null,
		_new: string | null
	) {
		this.log.push(
			`time changed from <b>${_old}</b> to <b>${_new}</b>`
		);
	}

	protected ready() {
		if (!this.time) {
			this.time = 0;
		}
	}

	protected render() {
		return html`
			<button id="tick">${this.time}</button>
			<ul>
				${this.log.map(l => `<li>${l}</li>`).join("")}
			</ul>
		`;
	}
}
