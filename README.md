# Ion

A lightweight Web Components engine for building reactive, typed, framework-independent UI.

Ion adds a compact component model on top of Custom Elements and Shadow DOM: rendering, state, properties, lifecycle, events, native form association, plugins, hooks, and DOM helpers—without hiding the platform.

> Status: `0.1.0-beta.2` pre-release.

## Install

```sh
pnpm add @gottheflag/ion
```

## Quick start

```ts
import {
	Component,
	Ion
} from "@gottheflag/ion";

import {
	state
} from "@gottheflag/ion/decorators";

import {
	html
} from "@gottheflag/ion/template";

@Ion.create("x-counter")
export class Counter extends Component {
	@state
	private count = 0;

	protected override created() {
		this.on(
			"click",
			"#increment",
			() => {
				this.count++;
			}
		);
	}

	protected override render() {
		return html`
			<button id="increment">
				Count: ${this.count}
			</button>
		`;
	}
}
```

```html
<x-counter></x-counter>
```

## Registration

Decorator form:

```ts
@Ion.create("x-panel")
class Panel extends Component {}
```

Deferred form:

```ts
class Panel extends Component {}

Ion.create(
	Panel,
	"x-panel"
);
```

Configure the shadow root when needed:

```ts
@Ion.create(
	"x-dialog",
	{
		root: {
			mode: "open",
			delegatesFocus: true
		}
	}
)
class Dialog extends Component {}
```

## Native form controls

Enable native form association with one flag:

```ts
import {
	property
} from "@gottheflag/ion/decorators";

@Ion.create(
	"ui-rating",
	{
		form: true
	}
)
class Rating extends Component {
	@property({
		type: Number
	})
	value = 0;
}
```

Ion then participates in ordinary HTML forms through `ElementInternals`; no hidden input is created.

### Automatic value contract

```text
formValue override -> use it
otherwise value exists -> use value
otherwise -> null
```

Automatic values may be strings, finite numbers, bigints, `File`, `FormData`, `null`, or `undefined`. Numbers and bigints become strings. Serialize `Date`, boolean, objects, and other values yourself.

Override `formValue` when the submitted representation is computed or has another name:

```ts
import {
	state
} from "@gottheflag/ion/decorators";

class DateTime extends Component {
	@state
	private local = "";

	@state
	private offset = "+03:00";

	protected override get formValue() {
		if (!this.local) return null;

		const date = new Date(
			`${this.local}:00${this.offset}`
		);

		return Number.isNaN(date.getTime())
			? null
			: date.toISOString();
	}
}
```

`formValue` should derive from component state/properties, not from rendered DOM. Ion may synchronize it before the next render.

Use `this.formControl` only for explicit native form operations. Generic code and plugins can check `this.hasFormControl` first without throwing:

```ts
if (this.hasFormControl) {
	this.formControl.setValue("serialized-value");
}

this.formControl.setValidity(
	{
		customError: true
	},
	"Invalid value."
);

this.formControl.clearValidity();
this.formControl.reportValidity();
```

`setValue()` accepts only the native form value types: `string`, `File`, `FormData`, or `null`. It is a one-off value; the next automatic synchronization reapplies `formValue`.

Reset behavior is deterministic: on the first connection Ion captures a writable `value`, if one exists. Native form reset restores that baseline before calling `formReset()`. Getter-only/computed values are left to the hook.

See the full rules and examples in [`docs/index.html`](docs/index.html#forms).

## Browser support

Ion's browser suite runs against Chromium, Firefox, and WebKit. Features that depend on browser APIs still require those APIs to exist; for example, `form: true` requires `attachInternals()` and is rejected at registration when the browser does not provide it.

## Core features

- reactive `@state`
- reflected `@property`
- declarative `html` templates
- DOM-preserving reconciliation
- connection-safe render scheduling
- clean component lifecycle hooks
- native form-associated custom elements
- automatic form-value synchronization
- native constraint-validation APIs
- owned event listeners with automatic cleanup
- delegated and explicit-target events
- typed custom events
- `@query` DOM snapshots
- `@watch` attribute observers
- `@cache` and `@once`
- constructable stylesheet support
- optional plugins
- global and component-scoped hooks
- direct DOM helpers: `$()`, `$$()`, and `attr()`

## Entry points

```ts
import {
	Component,
	Ion
} from "@gottheflag/ion";

import {
	html
} from "@gottheflag/ion/template";

import {
	cache,
	on,
	once,
	property,
	query,
	state,
	watch
} from "@gottheflag/ion/decorators";

import {
	Plugin
} from "@gottheflag/ion/plugin";

import {
	hok
} from "@gottheflag/ion/hook";
```

## Documentation

See [`docs/index.html`](docs/index.html).

Run it locally:

```sh
pnpm exec vite docs
```

## Development

```sh
pnpm install
pnpm exec playwright install chromium firefox webkit
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm bundle:check
pnpm package:check
```

## License

[Apache-2.0](LICENSE)
