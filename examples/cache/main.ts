import {
	cache,
	on
} from "@gottheflag/ion/decorators";
import {
	Component,
	Ion
} from "@gottheflag/ion";
import { html } from "@gottheflag/ion/template";

@Ion.create("x-cache")
export class Cache extends Component {
	private log(msg: string) {
		const pre =
			this.$<HTMLPreElement>(
				"#log"
			);

		if (!pre) return;

		pre.textContent +=
			msg + "\n";
	}

	@on("click", "#cached")
	cached() {
		this.log(
			`cached => ${this.expensive()}`
		);
	}

	protected render() {
		return html`
			<button id="cached">cached value</button>
			<pre id="log"></pre>
		`;
	}

	@cache
	expensive() {
		// assuming this is a heavy operation
		return Math.random()
			.toFixed(5);
	}
}
