import {
	on,
	state
} from "@gottheflag/ion/decorators";
import {
	Component,
	Ion
} from "@gottheflag/ion";
import { html } from "@gottheflag/ion/template";

@Ion.create("x-child")
export class Child extends Component {
	@state
	private n = 0;

	@on("click", "#fire")
	ping() {
		this.n++;
		this.emit(
			"ping",
			{ n: this.n }
		);
	}

	@on("pong")
	pong() {
		console.log("[PONG]");
	}

	protected render() {
		return html`
			<button id="fire">fire event (${this.n})</button>
		`;
	}
}

// Listen outside the component (bubbles + composed allow this)
document.addEventListener(
	"ping",
	(e: any) => {
		console.log("[PING]");

		(e.target as Component)
			.emit("pong");
	}
);
