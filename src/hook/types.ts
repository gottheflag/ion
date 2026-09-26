export type Id = symbol | string | undefined;

export type Phase =
	| "define"
	| "init"
	| "create"
	| "render"
	| "ready"
	| "remove"
	| "attribute:change"
	| "adopted"
	| "event:emit"
	| "plugin:install";

export type Stage =
	| "before"
	| "after";

export type Name = `${Stage}:${Phase}`;

export type HookFn<TArgs extends any[] = any[]> = (host: any, ...args: TArgs) => void;

export type Handle = {
	id: Id;
	off(): boolean;
};

export type Entry = {
	id: Id;
	fn: HookFn;
};