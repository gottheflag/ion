import { getOrInit } from "../../core/collections.js";
import {
	collectClassArrays,
	getOrInitOwn
} from "../../core/metadata.js";
import { hok } from "../../hook/hook.js";
import type { DecoratorKey } from "../types.js";

const STATE = Symbol("ion:state");
const STORAGE = new WeakMap<object, Map<DecoratorKey, any>>();
const INSTALLED = new WeakSet<object>();

function storage(host: object) {
	return getOrInit<object, Map<DecoratorKey, any>>(
		STORAGE,
		host,
		() => new Map()
	);
}

export function state(
	target: object | undefined,
	key: DecoratorKey
) {
	if (!target) return;

	const ctor =
		(target as any).constructor;

	const list =
		getOrInitOwn<DecoratorKey[]>(
			ctor,
			STATE,
			() => []
		);

	if (!list.includes(key)) {
		list.push(key);
	}
}

hok.after("init", (host: any) => {
	const ctor = host.constructor as any;
	const keys = collectClassArrays<DecoratorKey>(
		ctor,
		STATE
	);

	if (!keys.length) return;

	if (INSTALLED.has(host)) return;
	INSTALLED.add(host);

	const s = storage(host);

	for (const key of keys) {
		const desc = Object.getOwnPropertyDescriptor(host, key);

		if (desc && "value" in desc) {
			s.set(key, desc.value);

			if (!Reflect.deleteProperty(host, key)) {
				throw new TypeError(
					`[ION::STATE] Property "${String(key)}" is not configurable.`
				);
			}
		} else {
			s.set(key, (host as any)[ key ]);
		}

		Object.defineProperty(host, key, {
			get() {
				return s.get(key);
			},
			set(next: any) {
				const prev = s.get(key);
				if (Object.is(prev, next)) return;

				s.set(key, next);

				host.requestRender?.();
			}
		});
	}
});