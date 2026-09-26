# Ion

A lightweight Web Components engine for building reactive, typed, framework-independent UI.

Ion adds a compact component model on top of Custom Elements and Shadow DOM: rendering, state, properties, lifecycle, events, plugins, hooks, and DOM helpers—without hiding the platform.

> Status: `0.1.0-beta.1` pre-release.

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

## Core features

- reactive `@state`
- reflected `@property`
- declarative `html` templates
- DOM-preserving reconciliation
- connection-safe render scheduling
- clean component lifecycle hooks
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
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm bundle:check
pnpm package:check
```

## License

[Apache-2.0](LICENSE)
