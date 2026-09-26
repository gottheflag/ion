import {
	on,
	once
} from "@gottheflag/ion/decorators";
import {
	Component,
	Ion
} from "@gottheflag/ion";
import { html } from "@gottheflag/ion/template";

@Ion.create("x-once")
export class Once extends Component {
	private log(msg: string) {
		const pre =
			this.$<HTMLPreElement>(
				"#log"
			);

		if (!pre) return;

		pre.innerHTML +=
			msg + "\n";
	}

	@on("click", "#once")
	call() {
		this.init();
	}

	@once
	init() {
		this.log(
			`<span style="color: green">initialized at ${new Date().toISOString()}</span>`
		);
	}

	protected render() {
		return html`
			<button id="once">Call <code>init()</code></button>
			<pre id="log"></pre>
		`;
	}
}
