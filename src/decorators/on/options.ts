import type {
	EventName,
	ListenerOptions
} from "../../event/types.js";

export type Options = {
	type: EventName;
	selector?: string;
	method: (...args: any[]) => any;
	options?: ListenerOptions;
};
