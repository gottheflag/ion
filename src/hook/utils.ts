import { idMap } from "./state.js";
import type { Entry, Handle, HookFn, Name, Id as HookId } from "./types.js";

export function makeId() {
	return Math.random().toString(36).slice(2);
}

export function addTo(list: Entry[], name: Name, fn: HookFn, id?: HookId): Handle {
	if (id && idMap.has(id)) {
		throw new Error(`A hook with the id <${String(id)}> is already installed.`);
	}

	const randomId = makeId();
	const hookId = id ?? `ion:hook:[${name}]:${randomId}`;
	const entry: Entry = { id: hookId, fn };

	list.push(entry);
	idMap.set(hookId, { name, list });

	const off = () => {
		const idx = list.findIndex(e => e.id === hookId);
		if (idx >= 0) list.splice(idx, 1);
		idMap.delete(hookId);
	};
	
	return { id: hookId, off } as Handle;
}