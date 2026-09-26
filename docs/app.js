const toggle =
	document.querySelector(
		"#docs-sidebar-toggle"
	);

const links = Array.from(
	document.querySelectorAll(
		'.docs-sidebar a[href^="#"]'
	)
);

const sections = links
	.map(
		link => {
			const id =
				link.getAttribute(
					"href"
				);

			return id
				? document.querySelector(
					id
				)
				: null;
		}
	)
	.filter(
		section =>
			section instanceof HTMLElement
	);

function setCurrent(
	id
) {
	for (const link of links) {
		if (
			link.getAttribute(
				"href"
			) === id
		) {
			link.setAttribute(
				"aria-current",
				"location"
			);
		} else {
			link.removeAttribute(
				"aria-current"
			);
		}
	}
}

function closeSidebar() {
	if (
		toggle instanceof
			HTMLInputElement &&
		matchMedia(
			"(width < 64rem)"
		).matches
	) {
		toggle.checked = false;
	}
}

for (const link of links) {
	link.addEventListener(
		"click",
		closeSidebar
	);
}

document.addEventListener(
	"keydown",
	event => {
		if (
			event.key === "Escape" &&
			toggle instanceof
				HTMLInputElement &&
			toggle.checked
		) {
			toggle.checked = false;
		}
	}
);

const observer =
	new IntersectionObserver(
		entries => {
			const visible =
				entries
					.filter(
						entry =>
							entry.isIntersecting
					)
					.sort(
						(a, b) =>
							a.boundingClientRect.top -
							b.boundingClientRect.top
					)[0];

			if (
				visible?.target instanceof
					HTMLElement
			) {
				setCurrent(
					`#${visible.target.id}`
				);
			}
		},
		{
			rootMargin:
				"-18% 0px -72% 0px",
			threshold: 0
		}
	);

for (const section of sections) {
	observer.observe(
		section
	);
}

if (location.hash) {
	setCurrent(
		location.hash
	);
}
