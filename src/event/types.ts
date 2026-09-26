export type CustomEventKey = {
	[K in keyof HTMLElementEventMap]:
		HTMLElementEventMap[K] extends CustomEvent<any>
			? K
			: never;
}[keyof HTMLElementEventMap] & string;

export type CustomEventDetail<K extends CustomEventKey> =
	HTMLElementEventMap[K] extends CustomEvent<infer TDetail>
		? TDetail
		: never;

export type DetailForEvent<K extends string> =
	K extends CustomEventKey
		? CustomEventDetail<K>
		: any;

export type ListenerOptions =
	AddEventListenerOptions | boolean | undefined;

export type ExplicitEventTarget =
	| Window
	| Document
	| Element;

export type EventMapFor<T extends ExplicitEventTarget> =
	T extends Window
		? WindowEventMap
		: T extends Document
			? DocumentEventMap & GlobalEventHandlersEventMap
			: T extends HTMLElement
				? HTMLElementEventMap
				: T extends Element
					? ElementEventMap & GlobalEventHandlersEventMap
					: never;

export type EventNameFor<T extends ExplicitEventTarget> =
	| (keyof EventMapFor<T> & string)
	| (string & {});

export type EventName =
	EventNameFor<HTMLElement>;

export type EventFor<
	T extends ExplicitEventTarget,
	K extends EventNameFor<T>
> =
	K extends keyof EventMapFor<T>
		? EventMapFor<T>[K]
		: T extends HTMLElement
			? CustomEvent<any>
			: Event;

export type DirectListener<K extends EventName> =
	(event: EventFor<HTMLElement, K>) => any;

export type DelegatedListener<
	K extends EventName,
	M extends EventTarget = Element
> =
	(event: EventFor<HTMLElement, K>, matched: M) => any;