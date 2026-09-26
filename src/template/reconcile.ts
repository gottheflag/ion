export function reconcile(
	currentParent: Node & ParentNode,
	nextParent: Node & ParentNode
): void {
	let current = currentParent.firstChild;
	let next = nextParent.firstChild;

	while (current || next) {
		if (!current) {
			while (next) {
				const nextSibling: ChildNode | null = next.nextSibling;

				currentParent.appendChild(next);
				next = nextSibling;
			}

			return;
		}

		if (!next) {
			while (current) {
				const nextSibling: ChildNode | null = current.nextSibling;

				current.remove();
				current = nextSibling;
			}

			return;
		}

		if (canPatch(current, next)) {
			patch(current, next);

			current = current.nextSibling;
			next = next.nextSibling;

			continue;
		}

		const currentSibling: ChildNode | null =
			current.nextSibling;

		const nextSibling: ChildNode | null =
			next.nextSibling;

		currentParent.replaceChild(next, current);

		current = currentSibling;
		next = nextSibling;
	}
}

function canPatch(current: Node, next: Node): boolean {
	if (current.nodeType !== next.nodeType) {
		return false;
	}

	if (current.nodeType !== Node.ELEMENT_NODE) {
		return true;
	}

	const currentElement = current as Element;
	const nextElement = next as Element;

	return (
		currentElement.namespaceURI === nextElement.namespaceURI &&
		currentElement.localName === nextElement.localName &&
		currentElement.getAttribute("is") === nextElement.getAttribute("is")
	);
}

function patch(current: Node, next: Node): void {
	if (
		current.nodeType === Node.TEXT_NODE ||
		current.nodeType === Node.COMMENT_NODE
	) {
		if (current.nodeValue !== next.nodeValue) {
			current.nodeValue = next.nodeValue;
		}

		return;
	}

	if (current.nodeType !== Node.ELEMENT_NODE) {
		return;
	}

	const currentElement = current as Element;
	const nextElement = next as Element;

	patchAttributes(currentElement, nextElement);
	reconcile(currentElement, nextElement);
}

function patchAttributes(
	current: Element,
	next: Element
): void {
	for (const attribute of Array.from(current.attributes)) {
		if (
			!next.hasAttributeNS(
				attribute.namespaceURI,
				attribute.localName
			)
		) {
			current.removeAttributeNS(
				attribute.namespaceURI,
				attribute.localName
			);
		}
	}

	for (const attribute of Array.from(next.attributes)) {
		const currentValue = current.getAttributeNS(
			attribute.namespaceURI,
			attribute.localName
		);

		if (currentValue === attribute.value) {
			continue;
		}

		if (attribute.namespaceURI) {
			current.setAttributeNS(
				attribute.namespaceURI,
				attribute.name,
				attribute.value
			);
		} else {
			current.setAttribute(
				attribute.name,
				attribute.value
			);
		}
	}
}