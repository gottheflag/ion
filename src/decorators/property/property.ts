import { getOrInit } from "../../core/collections.js";
import { collectClassArrays, getOrInitOwn } from "../../core/metadata.js";
import { hok } from "../../hook/hook.js";
import { toKebabCase } from "../../utils.js";
import type { DecoratorKey } from "../types.js";
import { PROPERTY } from "./meta.js";
import { DEFAULTS, type Metadata, type Options } from "./options.js";

const STORAGE = new WeakMap<object, Map<string, any>>();
const INSTALLED = new WeakSet<object>();
const REFLECTING = new WeakMap<object, Set<string>>();

function storage(host: object) {
	return getOrInit<object, Map<string, any>>(STORAGE, host, () => new Map());
}

function reflection(host: any): Set<string> {
	return getOrInit<object, Set<string>>(REFLECTING, host, () => new Set());
}

function fromAttributeValue(prev: any, type: Options[ "type" ], v: string | null) {
	if (type === Boolean) return v !== null;
	if (v === null) return null;

	if (type === Number) {
		const n = Number(v);
		return Number.isFinite(n) ? n : prev;
	}

	return v;
}

export function property(options: Options = {}) {
	options = { ...DEFAULTS, ...options };

	return function (
		target: object | undefined,
		key: DecoratorKey
	): void {
		if (!target) return;

		if (typeof key !== "string") {
			throw new TypeError(
				"[ION::PROPERTY] Symbol properties are not supported."
			);
		}

		const ctor = target.constructor as any;
		const attribute = toKebabCase(options.attribute ?? key);

		const list = getOrInitOwn<Metadata[]>(ctor, PROPERTY, () => []);
		if (!list.some(p => p.attribute === attribute)) {
			list.push({
				key,
				attribute,
				...options
			});
		}
	}
}

hok.before("define", (ctor: any) => {
	const base = ctor.observedAttributes ?? [];

	Object.defineProperty(ctor, "observedAttributes", {
		get() {
			const props = collectClassArrays<Options>(ctor, PROPERTY) ?? [];
			const attrs = props.map(p => p.attribute);

			return [ ...new Set([ ...base, ...attrs ]) ];
		},
		configurable: true,
	});
});

hok.before("create", (host: any) => {
	const ctor = host.constructor as any;
	const props = collectClassArrays<Metadata>(ctor, PROPERTY) ?? [];
	if (!props.length) return;

	if (INSTALLED.has(host)) return;
	INSTALLED.add(host);

	const s = storage(host);


	for (const prop of props) {
		const { key, attribute, type } = prop;

		if (!s.has(key)) {
			const desc = Object.getOwnPropertyDescriptor(host, key);
			if (desc && "value" in desc) {
				s.set(key, desc.value);

				if (!Reflect.deleteProperty(host, key)) {
					throw new TypeError(
						`[ION::PROPERTY] Property "${key}" is not configurable.`
					);
				}
			} else {
				s.set(key, (host as any)[ key ]);
			}
		}

		Object.defineProperty(host, key, {
			get() {
				return s.get(key);
			},
			set(next: any) {
				const prev = s.get(key);
				if (Object.is(prev, next)) return;

				s.set(key, next);

				if (prop.reflect) {
					const ref = reflection(host);

					if (!ref.has(attribute)) {
						ref.add(attribute);
						try {
							host.attr(attribute, next);
						} finally {
							ref.delete(attribute);
						}
					}
				}

				if (prop.render) {
					host.requestRender?.();
				}
			},
			enumerable: true,
			configurable: true
		});

		if (host.hasAttribute(attribute)) {
			const raw = host.attr(attribute);
			const prev = s.get(key);
			const next = fromAttributeValue(prev, type, raw);
			s.set(key, next);

		} else if (prop.reflect) {
			const ref = reflection(host);
			if (!ref.has(attribute)) {
				ref.add(attribute);
				try {
					host.attr(attribute, s.get(key));
				} finally {
					ref.delete(attribute);
				}
			}
		}
	}
});

hok.before("attribute:change", (host: any, name: string, _oldValue: string | null, newValue: string | null) => {
	const ctor = host.constructor as any;
	const props = collectClassArrays<Metadata>(ctor, PROPERTY) ?? [];

	const attribute = toKebabCase(name);

	const ref = reflection(host);
	if (ref.has(attribute)) return;

	for (const p of props) {
		if (p.attribute !== attribute) continue;

		const prev = (host as any)[ p.key ];
		const type = p.type;
		const next = fromAttributeValue(prev, type, newValue);

		ref.add(attribute);
		try {
			(host as any)[ p.key ] = next;
		} finally {
			ref.delete(attribute);
		}

		break;
	}
});