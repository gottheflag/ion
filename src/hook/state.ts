import type {
	Entry,
	Id,
	Name
} from "./types.js";

export const idMap = new Map<
	Id,
	{
		name: Name;
		list: Entry[];
	}
>();