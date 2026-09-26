import type { Component } from "../core/component.js";

/**
 * Base Plugin class.
 * 
 * Plugin instances are created by the plugin manager (not by users)
 */
export abstract class Plugin<
	THost extends Component = Component,
	TOptions extends object = object
> {
	static id?: string;

	readonly host: THost;
	readonly root: ShadowRoot;
	readonly options: TOptions;

	/**
	 * 
	 * @param host The component this plugin is attached to.
	 * @param options The plugin options.
	 * 
	 * @remarks
	 * This constructor is called by the plugin manager.
	 */
	constructor(
		host: THost,
		options: TOptions
	) {
		this.host = host;
		this.root =
			(host as any).root;
		this.options = options;

		if (new.target === Plugin) {
			throw new Error(
				"Cannot instantiate abstract class Plugin directly."
			);
		}
	}

	/**
	 * Lifecycle hook called when the component is created and ready to be used.
	 * 
	 * @remarks
	 * Called after the component is connected to the DOM.
	 */
	protected created?(): void;

	/**
	 * Lifecycle hook called when the component is removed from the DOM.
	 * 
	 * @remarks
	 * Called before the component is removed from the DOM.
	 */
	protected removed?(): void;

	/**
	 * Lifecycle hook called when the component is adopted.
	 * 
	 * @remarks
	 * Moved to another document (e.g. iframe).
	 */
	protected adopted?(
		oldDoc: Document,
		newDoc: Document
	): void;

	/** Lifecycle hook called when the component is ready. */
	protected ready?(): void;

	/**
	 * Lifecycle hook called when an attribute is changed.
	 * 
	 * @param name The name of the attribute that changed.
	 * @param oldValue The previous value of the attribute.
	 * @param newValue The new value of the attribute.
	 */
	protected attributeChanged?(
		name: string,
		oldValue: string | null,
		newValue: string | null
	): void;

	/**
	 * Lifecycle hook called before the component is rendered.
	 */
	protected beforeRender?(): void;

	/**
	 * Lifecycle hook called after the component is rendered.
	 */
	protected afterRender?(): void;
}
