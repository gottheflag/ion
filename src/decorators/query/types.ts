import type {
	DecoratorKey
} from "../types.js";

export type Metadata = {
	key: DecoratorKey;
	selector: string;
	all: boolean;
};