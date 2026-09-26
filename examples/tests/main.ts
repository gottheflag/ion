import { html } from "@gottheflag/ion/template";
import {
	on,
	state
} from "@gottheflag/ion/decorators";
import {
	Component,
	Ion
} from "@gottheflag/ion";

@Ion.create("test-component")
export class TestComponent extends Component {
	static styles = `
		:host {
			display: block;
			border: 1px solid red;
			margin-bottom: 1rem;
			color: #555;
		}
	`;

	@state
	count = 0;

	@on("click", "button")
	increment() {
		this.count++;
	}

	@on("contextmenu", "button")
	decrement(ev: MouseEvent) {
		ev.preventDefault();
		this.count--;
	}

	protected ready(): void {
	}

	protected render() {
		return html`
			<h1>Hello World</h1>
			<button>${this.count}</button>
		`;
	}
}
