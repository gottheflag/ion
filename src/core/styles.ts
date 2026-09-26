type Style =
	| string
	| CSSStyleSheet;

export type Styles =
	| Style
	| Style[];

const CACHE =
	new WeakMap<
		Document,
		WeakMap<object, CSSStyleSheet[]>
	>();

export function styleSheets(
	document: Document,
	ctor: object,
	styles: Styles
): CSSStyleSheet[] {
	let documentCache =
		CACHE.get(document);

	if (!documentCache) {
		documentCache =
			new WeakMap<
				object,
				CSSStyleSheet[]
			>();

		CACHE.set(
			document,
			documentCache
		);
	}

	const cached =
		documentCache.get(ctor);

	if (cached) {
		return cached;
	}

	const definitions =
		Array.isArray(styles)
			? styles
			: [ styles ];

	const sheets: CSSStyleSheet[] = [];

	for (const style of definitions) {
		if (typeof style === "string") {
			if (!style) {
				continue;
			}

			const sheet =
				createStyleSheet(
					document
				);

			sheet.replaceSync(style);
			sheets.push(sheet);

			continue;
		}

		sheets.push(
			styleSheetForDocument(
				document,
				style
			)
		);
	}

	documentCache.set(
		ctor,
		sheets
	);

	return sheets;
}

function styleSheetForDocument(
	document: Document,
	style: CSSStyleSheet
): CSSStyleSheet {
	const StyleSheet =
		styleSheetConstructor(
			document
		);

	if (
		Object.prototype.isPrototypeOf.call(
			StyleSheet.prototype,
			style
		)
	) {
		return style;
	}

	const clone =
		new StyleSheet();

	clone.replaceSync(
		Array.from(
			style.cssRules,
			rule => rule.cssText
		).join("\n")
	);

	return clone;
}

function createStyleSheet(
	document: Document
): CSSStyleSheet {
	const StyleSheet =
		styleSheetConstructor(
			document
		);

	return new StyleSheet();
}

function styleSheetConstructor(
	document: Document
): typeof CSSStyleSheet {
	return (
		document.defaultView
			?.CSSStyleSheet ??
		CSSStyleSheet
	);
}
