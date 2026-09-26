import type { Component } from "../core/component.js";
import type { Plugin } from "./plugin.js";

/**
 * Plugin constructor type.
 * 
 * @remarks
 * This is the constructor type for the internal plugin class.
 */
export type Ctor<
	THost extends Component = Component,
	TOptions extends object = object
> = {
	id?: string;

	new(
		host: THost,
		options: TOptions
	): Plugin<THost, TOptions>;
};

export type Api<
	P extends Ctor<any, any>
> =
	Omit<
		InstanceType<P>,
		keyof Plugin<any, any>
	>;

export type OptionsOf<P> =
	P extends new (
		host: any,
		options: infer O
	) => any
		? O
		: never;

/**
 * Stored plugin registration options.
 */
export type Options = {
	plugin: Ctor;
	options?: any;
};
