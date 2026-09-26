import type {
	DelegatedListener,
	DetailForEvent,
	DirectListener,
	EventFor,
	EventName,
	EventNameFor,
	ExplicitEventTarget,
	ListenerOptions
} from "./types.js";

/**
 * Component events.
 */
export interface Events {
	/**
	 * Attaches an event listener with **automatic cleanup** on component removal.
	 * 
	 * @param type Event type.
	 * @param listener Event listener callback.
	 * @param options Event listener options.
	 * @returns A function that removes the event listener.
	 * 
	 * @remarks
	 * No need to call the remover manually when the component is removed,
	 * a cleanup process will be triggered automatically.
	 * 
	 * ---
	 * @example
	 * this.on("click", (ev) => {
	 *   console.log(ev);
	 * });
	 * 
	 * @example
	 * this.on("click", (ev) => {
	 *   console.log(ev);
	 * }, { passive: true });
	 * 
	 * @example
	 * this.on("click", "#btn", (ev, matched) => {
	 *   console.log(ev, matched);
	 * });
	 * 
	 * @example
	 * this.on("click", "#btn", (ev, matched) => {
	 *   console.log(ev, matched);
	 * }, { once: true });
	 */
	on<K extends EventName>(
		type: K,
		listener: DirectListener<K>,
		options?: ListenerOptions
	): () => void;

	on<K extends EventName>(
		type: K,
		selector: string,
		listener: DelegatedListener<K, Element>,
		options?: ListenerOptions
	): () => void;

	on<
		T extends ExplicitEventTarget,
		K extends EventNameFor<T>
	>(
		target: T,
		type: K,
		listener: (
			event: EventFor<T, K>,
			target: T
		) => any,
		options?: ListenerOptions
	): () => void;

	/**
	 * Emits a custom event.
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
		options?: Partial<CustomEventInit<DetailForEvent<K>>>
	): CustomEvent<DetailForEvent<K>>;
}