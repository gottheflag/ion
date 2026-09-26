# Ion Playground

A source-level POC for stressing Ion with a component that is intentionally more
complex than the small examples.

## Run

From the Ion repository root:

```sh
pnpm exec vite playground
```

Typecheck only the playground:

```sh
pnpm exec tsc -p playground/tsconfig.json --noEmit
```

## What Mission Control exercises

- `Ion.create()` registration
- `@state` reactive rendering
- reflected `@property` values
- `@watch` attribute observation
- `@query` snapshot references after render
- delegated `@on` handlers
- direct window/document listeners with automatic lifecycle cleanup
- typed composed custom events crossing the shadow boundary
- `@cache` and `@once`
- nested/array template results
- DOM reconciliation while filtering/searching
- a real plugin with create/render/ready/remove hooks
- per-component `hok.afterFor()` instrumentation
- disconnect/reconnect from outside the component

The goal is not to become a second demo site. It is a pressure chamber for
features that should remain pleasant when a component stops being trivial.
