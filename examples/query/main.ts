import {
	on,
	query
} from "@gottheflag/ion/decorators";
import {
	Component,
	Ion
} from "@gottheflag/ion";
import { html } from "@gottheflag/ion/template";

@Ion.create("x-query")
export class Query extends Component {
	static styles = `
		#history {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			margin-top: 1rem;
		}

		#history > * {
			margin: 0;
		}
	`;

	@query("#username")
	username!: HTMLInputElement | null;

	@query("#history")
	history!: HTMLDivElement;

	private log(msg: string) {
		this.history.innerHTML +=
			msg + "\n";
	}

	@on("input", "#username")
	input() {
		if (!this.username?.value) {
			return;
		}

		this.log(
			`<p>${this.username.value}</p>`
		);
	}

	protected render() {
		return html`
			<input id="username" type="text" value="yourname">
			<div id="history"></div>
		`;
	}
}
