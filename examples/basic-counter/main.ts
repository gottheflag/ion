import {
	Component,
	Ion
} from "@gottheflag/ion";
import {
	state,
	on
} from "@gottheflag/ion/decorators";
import { html } from "@gottheflag/ion/template";

@Ion.create("x-counter")
export class Counter extends Component {
	@state
	count = 0;

	@on("click", "#inc")
	increment() {
		this.count++;
	}

	protected render() {
		return html`
			<button id="inc">count: ${this.count}</button>
		`;
	}
}
