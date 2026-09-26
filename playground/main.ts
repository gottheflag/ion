import type {
	MissionControl
} from "./components/mission-control.js";

type PlaygroundEvent =
	| "mission:boot"
	| "mission:select"
	| "mission:change"
	| "mission:mode";

const stage =
	document.querySelector<HTMLElement>(
		"#stage"
	);

const log =
	document.querySelector<HTMLElement>(
		"#event-log"
	);

const reconnect =
	document.querySelector<HTMLButtonElement>(
		"#reconnect"
	);

const compact =
	document.querySelector<HTMLButtonElement>(
		"#compact"
	);

const review =
	document.querySelector<HTMLButtonElement>(
		"#review"
	);

function component():
	MissionControl | null {
	return stage?.querySelector(
		"x-ion-mission-control"
	) as MissionControl | null;
}

function writeEvent(
	type: PlaygroundEvent,
	event: Event
): void {
	if (!log) return;

	const custom =
		event as CustomEvent<unknown>;

	const line =
		JSON.stringify(
			{
				type,
				detail:
					custom.detail
			},
			null,
			2
		);

	log.textContent =
		`${line}\n\n${log.textContent ?? ""}`
			.slice(
				0,
				5000
			);
}

for (
	const type of [
		"mission:boot",
		"mission:select",
		"mission:change",
		"mission:mode"
	] as const
) {
	document.addEventListener(
		type,
		event => {
			writeEvent(
				type,
				event
			);
		}
	);
}

reconnect?.addEventListener(
	"click",
	() => {
		const current =
			component();

		if (
			!current ||
			!stage
		) return;

		current.remove();

		window.setTimeout(
			() => {
				stage.append(
					current
				);
			},
			450
		);
	}
);

compact?.addEventListener(
	"click",
	() => {
		const current =
			component();

		if (!current) return;

		current.compact =
			!current.compact;
	}
);

review?.addEventListener(
	"click",
	() => {
		const current =
			component();

		if (!current) return;

		current.mode =
			current.mode === "review"
				? "focus"
				: "review";
	}
);
