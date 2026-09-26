import { type Options as ComponentOptions, OPTIONS as OPTIONS_SYMBOL } from "./options.js";
import { toKebabCase } from "../utils.js";
import { run as runHook } from "../hook/hook.js";
import type { Name as HookName } from "../hook/types.js";
import { commitTemplate, type TemplateResult } from "../template/index.js";
import { Lifecycle } from "@gottheflag/lifecycle";
import type {
	DetailForEvent,
	EventName,
	Events,
	ExplicitEventTarget,
	ListenerOptions
} from "../event/index.js";
import {
	styleSheets,
	type Styles
} from "./styles.js";
import type {
	Api as PluginApi,
	Ctor as PluginCtor,
	Options as PluginOptions,
	OptionsOf
} from "../plugin/types.js";

import { pluginRuntime } from "./plugin-bridge.js";

/**
 * Base class for components.
 * 
 * @remarks
 * This class is not meant to be used directly.
 * Instead, extend this class and use the decorators to define the component.
 */
export abstract class Component extends HTMLElement implements Events {
	protected readonly options: ComponentOptions | undefined;

	constructor() {
		super();

		this.options = (this.constructor as any)[ OPTIONS_SYMBOL ] as ComponentOptions | undefined;

		this.runHook("before:init");

		this.root = this.attachShadow({
			mode: this.options?.root?.mode ?? 'open',
			...this.options?.root
		});

		this.#applyStyles();

		this.runHook("after:init");
	}

	/**
	 * Shadow root of the component.
	 * 
	 * ---
	 * @example
	 * this.root.innerHTML = `<h1>Hello World</h1>`;
	 */
	protected readonly root: ShadowRoot;

	/**
	 * Styles applied to the component.
	 * 
	 * @remarks
	 * Styles are applied to the component's shadow root.
	 * 
	 * ---
	 * @example
	 * sheet = new CSSStyleSheet();
	 * sheet.replaceSync(`
	 *   h1 {
	 *     color: red;
	 *   }
	 * `);
	 * 
	 * static styles = [
	 *   "h1 { color: red; }",
	 *   `
	 *     h1 {
	 *       color: red;
	 *     }
	 *   `,
	 *   sheet
	 * ];
	 */
	protected static styles:
		| string
		| CSSStyleSheet
		| (string | CSSStyleSheet)[] = '';

	/**
	 * Is the component queued for rendering?
	 * 
	 * @remarks
	 * Prevent multiple render requests.
	 * @internal
	 */
	private _renderQueued = false;

	/**
	 * Is the component ready?
	 */
	protected isReady = false;

	#lifecycle = new Lifecycle();
	#disconnectPending = false;

	#applyStyles(): void {
		const stylesDef =
			(this.constructor as typeof Component)
				.styles as Styles;

		this.root.adoptedStyleSheets =
			styleSheets(
				this.root.ownerDocument,
				this.constructor,
				stylesDef
			);
	}

	/**
	 * Renders the component.
	 * 
	 * 
	 * @remarks
	 * - Called automatically when the component is connected to the DOM.
	 * - Re-called automatically via internal mechanisms.
	 * - You **never** need to call this method manually (use `requestRender` instead).
	 * 
	 * @see {@link Component.requestRender | requestRender}
	 * 
	 * ---
	 * @example
	 * protected render() {
	 *   return html`<h1>${this.count}</h1>`;
	 * }
	 */
	protected render?(): TemplateResult | null;

	/**
	 * Queue requests to render the component.
	 * 
	 * Safe to call multiple times (eventually a single request will be made).
	 * 
	 * ---
	 * @example
	 * this.var++;
	 * requestRender();
	 */
	protected requestRender() {
		if (
			this._renderQueued ||
			!this.isConnected
		) return;

		this._renderQueued = true;

		queueMicrotask(() => {
			this._renderQueued = false;

			if (!this.isConnected) return;

			try {
				this.runHook("before:render");

				const result = this.render?.();
				if (result) {
					commitTemplate(result, this.root);
				}

				this.runHook("after:render");

				if (!this.isReady) {
					this.isReady = true;

					this.runHook("before:ready");
					this.ready?.();
					this.runHook("after:ready");
				}
			} catch (err) {
				console.error(`[ION::RENDER] <${this.localName}>`, err);
			}
		});
	}

	/**
	 * Lifecycle hook called when the component is inserted into the DOM.
	 */
	protected created?(): void;
	connectedCallback() {
		if (this.#disconnectPending) {
			this.#disconnectPending = false;
			return;
		}

		if (this.#lifecycle.destroyed) {
			this.#lifecycle = new Lifecycle();
		}

		this.runHook("before:create");
		this.created?.();
		this.runHook("after:create");

		this.requestRender();
	}

	/**
	 * Lifecycle hook called when the component is ready.
	 */
	protected ready?(): void;

	/**
	 * Lifecycle hook called when the component is removed from the DOM.
	 */
	protected removed?(): void;
	disconnectedCallback() {
		this.#disconnectPending = true;

		queueMicrotask(() => {
			if (!this.#disconnectPending || this.isConnected) return;

			this.#disconnectPending = false;
			this.#lifecycle.destroy();

			this.runHook("before:remove");
			this.removed?.();
			this.runHook("after:remove");
		});
	}

	/**
	 * Lifecycle hook called when the component is adopted.
	 * 
	 * @remarks
	 * Moved to another document (e.g. iframe).
	 */
	protected adopted?(oldDoc: Document, newDoc: Document): void;
	adoptedCallback(oldDoc: Document, newDoc: Document) {
		this.#applyStyles();

		this.runHook("before:adopted", oldDoc, newDoc);
		this.adopted?.(oldDoc, newDoc);
		this.runHook("after:adopted", oldDoc, newDoc);
	}

	/**
	 * List of attributes that should be observed.
	 * 
	 * @remarks
	 * Defining this property here isn't important (it can be removed).
	 */
	protected observedAttributes: string[] = [];

	/**
	 * Lifecycle hook called when an attribute is changed.
	 * 
	 * @param name The name of the attribute that changed.
	 * @param oldValue The previous value of the attribute.
	 * @param newValue The new value of the attribute.
	 * 
	 * ---
	 * @example
	 * setAttribute("value", "xyz");
	 */
	protected attributeChanged?(name: string, oldValue: string | null, newValue: string | null): void;
	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
		this.runHook("before:attribute:change", name, oldValue, newValue);
		this.attributeChanged?.(name, oldValue, newValue);
		this.runHook("after:attribute:change", name, oldValue, newValue);
	}

	get on(): Events[ "on" ] {
		return this.#on;
	}

	#on(
		typeOrTarget: EventName | ExplicitEventTarget,
		typeOrListener: EventName | ((...args: any[]) => any),
		listenerOrOptions?: ((...args: any[]) => any) | ListenerOptions,
		options?: ListenerOptions
	): () => void {
		let target: EventTarget;
		let type: string;
		let handler: EventListener;
		let opts: ListenerOptions;

		if (typeof typeOrTarget !== "string") {
			target = typeOrTarget;
			type = typeOrListener as string;

			const listener =
				listenerOrOptions as (
					event: Event,
					target: EventTarget
				) => any;

			handler = (event: Event) => {
				listener(event, typeOrTarget);
			};

			opts = options;
		} else if (typeof typeOrListener === "string") {
			target = this.root;
			type = typeOrTarget;

			const selector = typeOrListener;
			const listener =
				listenerOrOptions as (
					event: Event,
					matched: Element
				) => any;

			handler = (event: Event) => {
				const source = event.target;

				if (!(source instanceof Element)) return;

				const match = source.closest(selector);
				if (!match) return;

				listener(event, match);
			};

			opts = options;
		} else {
			target = this;
			type = typeOrTarget;
			handler = typeOrListener as EventListener;
			opts = listenerOrOptions as ListenerOptions;
		}

		target.addEventListener(type, handler, opts);

		return this.#lifecycle.defer(() => {
			target.removeEventListener(type, handler, opts);
		});
	}

	/**
	 * Emits a custom event.
	 * 
	 * @default
	 * - `bubbles`: true
	 *   - Event travels up the DOM tree.
	 * - `composed`: true
	 *   - Event can be listened to outside the component.
	 * - `cancelable`: false
	 *   - Default event cannot be prevented.
	 * 
	 * @param type Event type.
	 * @param detail Event details.
	 * @param options Event options.
	 * @returns The custom event.
	 * 
	 * ---
	 * @example
	 * this.emit("message", { text: "Hello World" });
	 */
	emit<K extends string>(
		type: K,
		detail?: DetailForEvent<K>,
		options: Partial<CustomEventInit<DetailForEvent<K>>> = {}
	): CustomEvent<DetailForEvent<K>> {
		const event = new CustomEvent<DetailForEvent<K>>(type, {
			detail,
			bubbles: options.bubbles ?? true,
			composed: options.composed ?? true,
			cancelable: options.cancelable ?? false,
			...options,
		});

		this.runHook("before:event:emit", type, event);
		this.dispatchEvent(event);
		this.runHook("after:event:emit", type, event);

		return event;
	}

	/**
	 * Queries the first matching child element inside the render root.
	 * 
	 * @param selector Selector to a child element.
	 * @returns The first child element that matches the selector, or null if not found.
	 * 
	 * ---
	 * @example
	 * this.$("#btn"); // <button id="btn">
	 */
	$<T extends Element = Element>(selector: string): T | null {
		return this.root.querySelector(selector) as T | null;
	}

	/**
	 * Queries all matching child elements inside the render root.
	 * 
	 * @param selector Selector to child elements.
	 * @returns The child elements that match the selector, or an empty array if not found.
	 * 
	 * ---
	 * @example
	 * this.$$("li"); // [<li>, <li>, ...]
	 */
	$$<T extends Element = Element>(selector: string): NodeListOf<T> {
		return this.root.querySelectorAll(selector) as NodeListOf<T>;
	}

	/**
	 * Gets or sets an attribute.
	 * 
	 * @param name Attribute name.
	 * @param value Attribute value.
	 * @returns Attribute value if no value is provided, otherwise nothing.
	 * 
	 * ---
	 * @example
	 * this.attr("value"); // returns "xyz"
	 * 
	 * @example
	 * this.attr("value", "xyz"); // `value="xyz"`
	 * 
	 * @example
	 * this.attr("disabled", true); // `disabled`
	 * 
	 * @example
	 * this.attr("hidden", false); // attribute removed
	 */
	attr(name: string): string | null;

	/** @overload */
	attr(
		name: string,
		value: string | number | boolean | null | undefined
	): void;

	/** @overload */
	attr(
		name: string,
		value?: string | number | boolean | null | undefined
	): string | null | void {
		name = toKebabCase(name);

		if (arguments.length === 1) return this.getAttribute(name);

		if (value === false || value == null) {
			this.removeAttribute(name);
		} else if (value === true) {
			this.setAttribute(name, "");
		} else {
			this.setAttribute(name, String(value));
		}
	}

	protected runHook(name: HookName, ...args: any[]) {
		runHook(this, name, ...args);
	}

	static use<
		P extends PluginCtor<any, any>
	>(
		plugin: P,
		options?: OptionsOf<P>
	) {
		const runtime =
			pluginRuntime();

		if (
			runtime.has(this, plugin)
		) {
			console.warn(
				`Plugin <${plugin.name}> is already installed on <${this.name}>.`
			);

			return this;
		}

		runtime.register(
			this,
			plugin,
			options
		);

		return this;
	}

	plugin<
		P extends PluginCtor<any, any>
	>(
		plugin: P
	): PluginApi<P> {
		return pluginRuntime().get(
			this,
			plugin
		) as PluginApi<P>;
	}

	get plugins(): PluginOptions[] {
		return pluginRuntime().collect(
			this.constructor
		) as PluginOptions[];
	}
}