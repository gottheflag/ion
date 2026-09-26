import {
	Component,
	Ion
} from "../../src/index.js";

import {
	cache,
	on,
	once,
	property,
	query,
	state,
	watch
} from "../../src/decorators/index.js";

import {
	html,
	type TemplateResult
} from "../../src/template/index.js";

import {
	hok
} from "../../src/hook/index.js";

import {
	TelemetryPlugin
} from "../plugins/telemetry.js";

type MissionStatus =
	| "todo"
	| "active"
	| "done";

type MissionFilter =
	| "all"
	| MissionStatus;

type MissionMode =
	| "focus"
	| "review"
	| "ship";

type Mission = {
	title: string;
	area: string;
	status: MissionStatus;
	score: number;
};

type MissionSelection = {
	index: number;
	title: string;
	status: MissionStatus;
};

declare global {
	interface HTMLElementEventMap {
		"mission:boot":
			CustomEvent<{
				missions: number;
			}>;

		"mission:select":
			CustomEvent<MissionSelection>;

		"mission:change":
			CustomEvent<{
				action: string;
				title: string;
				status: MissionStatus;
			}>;

		"mission:mode":
			CustomEvent<{
				mode: MissionMode;
			}>;
	}
}

const INITIAL_MISSIONS: readonly Mission[] = [
	{
		title: "Reconcile keyed-looking UI without keys",
		area: "template",
		status: "done",
		score: 10
	},
	{
		title: "Own listeners across real reconnects",
		area: "lifecycle",
		status: "done",
		score: 9
	},
	{
		title: "Keep plugin runtime tree-shakeable",
		area: "plugins",
		status: "active",
		score: 8
	},
	{
		title: "Ship typed custom event ergonomics",
		area: "events",
		status: "active",
		score: 7
	},
	{
		title: "Pressure-test reflected properties",
		area: "decorators",
		status: "todo",
		score: 6
	},
	{
		title: "Prove the beta with a real component",
		area: "playground",
		status: "todo",
		score: 10
	}
];

function cloneMissions(): Mission[] {
	return INITIAL_MISSIONS.map(
		mission => ({
			...mission
		})
	);
}

@Ion.create("x-ion-mission-control")
export class MissionControl
	extends Component {

	protected static override styles = `
		:host {
			--accent: #c84548;
			--ink: #171717;
			--muted: #707070;
			--line: #e5e5e5;
			--surface: #ffffff;
			--surface-soft: #fafafa;
			--good: #16794b;
			--warn: #a56500;

			display: block;
			color: var(--ink);
		}

		:host([mode="review"]) {
			--accent: #7b4fbd;
		}

		:host([mode="ship"]) {
			--accent: #16794b;
		}

		* {
			box-sizing: border-box;
		}

		button,
		input {
			font: inherit;
		}

		button {
			color: inherit;
		}

		.frame {
			min-height: 680px;
			border: 1px solid var(--line);
			border-radius: 18px;
			overflow: hidden;
			background: var(--surface);
			box-shadow: 0 18px 50px rgba(0, 0, 0, 0.06);
		}

		.topbar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			padding: 16px 18px;
			border-bottom: 1px solid var(--line);
			background: var(--surface);
		}

		.brand {
			display: flex;
			align-items: center;
			gap: 10px;
			min-width: 0;
		}

		.brand__mark {
			display: grid;
			place-items: center;
			width: 34px;
			aspect-ratio: 1;
			border-radius: 9px;
			background: var(--accent);
			color: #fff;
			font-weight: 900;
		}

		.brand__copy {
			min-width: 0;
		}

		.brand strong,
		.brand small {
			display: block;
		}

		.brand small {
			margin-top: 2px;
			color: var(--muted);
			font-size: 0.72rem;
		}

		.topbar__actions,
		.filters,
		.command-row {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 7px;
		}

		.pill,
		.action,
		.filter,
		.mission-select {
			border: 1px solid var(--line);
			background: var(--surface);
			cursor: pointer;
		}

		.pill,
		.action,
		.filter {
			border-radius: 9px;
			padding: 8px 10px;
			font-size: 0.8rem;
		}

		.action:hover,
		.filter:hover,
		.mission-select:hover {
			border-color: var(--accent);
		}

		.layout {
			display: grid;
			grid-template-columns: 250px minmax(0, 1fr) 300px;
			min-height: 620px;
		}

		.sidebar,
		.inspector {
			padding: 18px;
			background: var(--surface-soft);
		}

		.sidebar {
			border-right: 1px solid var(--line);
		}

		.inspector {
			border-left: 1px solid var(--line);
		}

		.section-title {
			margin: 0 0 10px;
			color: var(--muted);
			font-size: 0.7rem;
			font-weight: 800;
			letter-spacing: 0.09em;
			text-transform: uppercase;
		}

		.metric-grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 8px;
			margin-bottom: 22px;
		}

		.metric {
			padding: 12px;
			border: 1px solid var(--line);
			border-radius: 11px;
			background: var(--surface);
		}

		.metric strong {
			display: block;
			font-size: 1.2rem;
		}

		.metric small {
			color: var(--muted);
			font-size: 0.7rem;
		}

		.shortcut-list {
			display: grid;
			gap: 7px;
		}

		.shortcut {
			display: flex;
			justify-content: space-between;
			gap: 12px;
			color: var(--muted);
			font-size: 0.78rem;
		}

		kbd {
			min-width: 28px;
			padding: 2px 6px;
			border: 1px solid var(--line);
			border-bottom-width: 2px;
			border-radius: 6px;
			background: var(--surface);
			color: var(--ink);
			text-align: center;
			font: 0.72rem "SFMono-Regular", Consolas, monospace;
		}

		.main {
			min-width: 0;
			padding: 20px;
		}

		.main-head {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			gap: 14px;
			align-items: end;
			margin-bottom: 16px;
		}

		.main-head h2,
		.inspector h3 {
			margin: 0;
		}

		.main-head p,
		.inspector p {
			margin: 5px 0 0;
			color: var(--muted);
			line-height: 1.5;
		}

		.search {
			width: 100%;
			margin-top: 14px;
			padding: 11px 12px;
			border: 1px solid var(--line);
			border-radius: 10px;
			outline: none;
			background: var(--surface-soft);
		}

		.search:focus {
			border-color: var(--accent);
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 13%, transparent);
		}

		.missions {
			display: grid;
			gap: 9px;
			margin-top: 14px;
		}

		.mission {
			display: grid;
			grid-template-columns: 12px minmax(0, 1fr) auto;
			gap: 12px;
			align-items: center;
			padding: 12px;
			border: 1px solid var(--line);
			border-radius: 12px;
			background: var(--surface);
		}

		.mission--selected {
			border-color: var(--accent);
			box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 10%, transparent);
		}

		.status-dot {
			width: 9px;
			aspect-ratio: 1;
			border-radius: 999px;
			background: #b7b7b7;
		}

		.mission--active .status-dot {
			background: var(--warn);
		}

		.mission--done .status-dot {
			background: var(--good);
		}

		.mission strong,
		.mission small {
			display: block;
		}

		.mission small {
			margin-top: 3px;
			color: var(--muted);
			font-size: 0.72rem;
		}

		.mission-select {
			border-radius: 8px;
			padding: 7px 9px;
			font-size: 0.75rem;
		}

		.empty {
			padding: 34px 18px;
			border: 1px dashed var(--line);
			border-radius: 12px;
			color: var(--muted);
			text-align: center;
		}

		.progress {
			display: grid;
			grid-template-columns: repeat(10, 1fr);
			gap: 3px;
			margin: 11px 0 18px;
		}

		.progress span {
			height: 7px;
			border-radius: 2px;
			background: #e8e8e8;
		}

		.progress .is-on {
			background: var(--accent);
		}

		.detail-card,
		.activity {
			margin-top: 14px;
			padding: 14px;
			border: 1px solid var(--line);
			border-radius: 12px;
			background: var(--surface);
		}

		.detail-row {
			display: flex;
			justify-content: space-between;
			gap: 12px;
			padding: 7px 0;
			border-bottom: 1px solid var(--line);
			font-size: 0.78rem;
		}

		.detail-row:last-child {
			border-bottom: 0;
		}

		.detail-row span:first-child {
			color: var(--muted);
		}

		.activity {
			display: grid;
			gap: 8px;
			max-height: 190px;
			overflow: auto;
		}

		.activity-item {
			font-size: 0.75rem;
			line-height: 1.45;
		}

		:host([compact]) .layout {
			grid-template-columns: 210px minmax(0, 1fr) 250px;
		}

		:host([compact]) .mission {
			padding: 8px 10px;
		}

		@media (max-width: 1100px) {
			.layout {
				grid-template-columns: 210px minmax(0, 1fr);
			}

			.inspector {
				grid-column: 1 / -1;
				border-top: 1px solid var(--line);
				border-left: 0;
			}
		}

		@media (max-width: 760px) {
			.topbar,
			.main-head {
				display: grid;
			}

			.layout,
			:host([compact]) .layout {
				grid-template-columns: 1fr;
			}

			.sidebar,
			.inspector {
				border: 0;
			}

			.sidebar {
				border-bottom: 1px solid var(--line);
			}
		}
	`;

	@property({
		type: String,
		reflect: true
	})
	mode: MissionMode = "focus";

	@property({
		type: Boolean,
		reflect: true
	})
	compact = false;

	@state
	private missions =
		cloneMissions();

	@state
	private filter:
		MissionFilter = "all";

	@state
	private search = "";

	@state
	private selectedIndex = 0;

	@state
	private activity: string[] = [
		"Mission Control instance allocated."
	];

	@query("#search")
	private searchInput:
		HTMLInputElement | null = null;

	@query(".mission-select", {
		all: true
	})
	private missionButtons:
		HTMLButtonElement[] = [];

	@cache
	private get shortcutLegend() {
		return [
			[ "/", "Focus search" ],
			[ "J / K", "Move selection" ],
			[ "Enter", "Advance mission" ],
			[ "Esc", "Clear search" ]
		] as const;
	}

	protected override created(): void {
		this.boot();

		this.on(
			window,
			"keydown",
			event => {
				this.handleKeyboard(
					event
				);
			}
		);

		this.on(
			document,
			"visibilitychange",
			() => {
				this.pushActivity(
					document.hidden
						? "Document moved to background."
						: "Document became visible."
				);
			}
		);
	}

	protected override ready(): void {
		this.pushActivity(
			"First render committed; @query references are live."
		);
	}

	protected override removed(): void {
		console.info(
			"[PLAYGROUND::MISSION]",
			"component disconnected; owned listeners were released"
		);
	}

	@once
	private boot(): void {
		this.pushActivity(
			"created() established window/document listeners."
		);

		this.emit(
			"mission:boot",
			{
				missions:
					this.missions.length
			}
		);
	}

	@watch("mode")
	// @ts-expect-error - we won't be calling this
	private modeChanged(
		oldValue: string | null,
		newValue: string | null
	): void {
		if (
			!newValue ||
			oldValue === newValue
		) return;

		this.pushActivity(
			`Mode changed: ${oldValue ?? "unset"} → ${newValue}`
		);

		this.emit(
			"mission:mode",
			{
				mode:
					newValue as MissionMode
			}
		);
	}

	@on(
		"input",
		"#search"
	)
	// @ts-expect-error - we won't be calling this
	private updateSearch(
		_event: Event,
		matched: Element
	): void {
		if (
			!(matched instanceof HTMLInputElement)
		) return;

		this.search =
			matched.value;

		this.selectedIndex = 0;
	}

	@on(
		"click",
		"[data-filter]"
	)
	// @ts-expect-error - we won't be calling this
	private chooseFilter(
		_event: Event,
		matched: Element
	): void {
		if (
			!(matched instanceof HTMLButtonElement)
		) return;

		const next =
			matched.dataset.filter;

		if (
			next !== "all" &&
			next !== "todo" &&
			next !== "active" &&
			next !== "done"
		) return;

		this.filter = next;
		this.selectedIndex = 0;

		this.pushActivity(
			`Filter changed to "${next}".`
		);
	}

	@on(
		"click",
		".mission-select"
	)
	// @ts-expect-error - we won't be calling this
	private chooseMission(
		_event: Event,
		matched: Element
	): void {
		const index =
			this.missionButtons.indexOf(
				matched as HTMLButtonElement
			);

		if (index < 0) return;

		this.selectedIndex =
			index;

		this.emitSelection();
	}

	@on(
		"click",
		"[data-action]"
	)
	// @ts-expect-error - we won't be calling this
	private runAction(
		_event: Event,
		matched: Element
	): void {
		if (
			!(matched instanceof HTMLButtonElement)
		) return;

		switch (
			matched.dataset.action
		) {
			case "advance":
				this.advanceSelected();
				break;

			case "add":
				this.addMission();
				break;

			case "reset":
				this.reset();
				break;

			case "mode":
				this.cycleMode();
				break;

			case "compact":
				this.compact =
					!this.compact;
				break;
		}
	}

	private handleKeyboard(
		event: KeyboardEvent
	): void {
		const typing =
			event.target instanceof
				HTMLInputElement;

		if (
			event.key === "/" &&
			!typing
		) {
			event.preventDefault();
			this.searchInput?.focus();
			return;
		}

		if (
			event.key === "Escape"
		) {
			this.search = "";

			if (this.searchInput) {
				this.searchInput.value = "";
			}

			this.searchInput?.blur();
			return;
		}

		if (typing) return;

		if (
			event.key.toLowerCase() === "j"
		) {
			this.moveSelection(1);
		} else if (
			event.key.toLowerCase() === "k"
		) {
			this.moveSelection(-1);
		} else if (
			event.key === "Enter"
		) {
			this.advanceSelected();
		}
	}

	private moveSelection(
		direction: -1 | 1
	): void {
		const visible =
			this.visibleMissions();

		if (!visible.length) return;

		const next =
			(
				this.selectedIndex +
				direction +
				visible.length
			) %
			visible.length;

		this.selectedIndex = next;
		this.emitSelection();
	}

	private advanceSelected(): void {
		const visible =
			this.visibleMissions();

		const selected =
			visible[
				this.selectedIndex
			];

		if (!selected) return;

		const nextStatus:
			MissionStatus =
			selected.mission.status === "todo"
				? "active"
				: selected.mission.status === "active"
					? "done"
					: "todo";

		this.missions =
			this.missions.map(
				(mission, index) =>
					index ===
						selected.sourceIndex
						? {
							...mission,
							status: nextStatus
						}
						: mission
			);

		this.pushActivity(
			`${selected.mission.title} → ${nextStatus}.`
		);

		this.emit(
			"mission:change",
			{
				action: "advance",
				title:
					selected.mission.title,
				status:
					nextStatus
			}
		);
	}

	private addMission(): void {
		const number =
			this.missions.length + 1;

		const mission: Mission = {
			title:
				`Runtime mission #${number}`,
			area: "dynamic",
			status: "todo",
			score:
				4 +
				(number % 7)
		};

		this.missions = [
			...this.missions,
			mission
		];

		this.filter = "all";
		this.search = "";
		this.selectedIndex =
			this.missions.length - 1;

		if (this.searchInput) {
			this.searchInput.value = "";
		}

		this.pushActivity(
			`Added "${mission.title}".`
		);
	}

	private reset(): void {
		this.missions =
			cloneMissions();

		this.filter = "all";
		this.search = "";
		this.selectedIndex = 0;

		if (this.searchInput) {
			this.searchInput.value = "";
		}

		this.pushActivity(
			"Mission data reset."
		);
	}

	private cycleMode(): void {
		const next:
			MissionMode =
			this.mode === "focus"
				? "review"
				: this.mode === "review"
					? "ship"
					: "focus";

		this.mode = next;
	}

	private emitSelection(): void {
		const visible =
			this.visibleMissions();

		const selected =
			visible[
				this.selectedIndex
			];

		if (!selected) return;

		this.emit(
			"mission:select",
			{
				index:
					this.selectedIndex,
				title:
					selected.mission.title,
				status:
					selected.mission.status
			}
		);
	}

	private pushActivity(
		message: string
	): void {
		this.activity = [
			message,
			...this.activity
		].slice(0, 8);
	}

	private visibleMissions() {
		const query =
			this.search
				.trim()
				.toLocaleLowerCase();

		return this.missions
			.map(
				(mission, sourceIndex) => ({
					mission,
					sourceIndex
				})
			)
			.filter(
				({ mission }) =>
					(
						this.filter === "all" ||
						mission.status ===
							this.filter
					) &&
					(
						query.length === 0 ||
						mission.title
							.toLocaleLowerCase()
							.includes(query) ||
						mission.area
							.toLocaleLowerCase()
							.includes(query)
					)
			);
	}

	private count(
		status: MissionStatus
	): number {
		return this.missions.filter(
			mission =>
				mission.status === status
		).length;
	}

	private progressSegments(
		value: number
	): TemplateResult[] {
		return Array.from(
			{
				length: 10
			},
			(_entry, index) =>
				index < value
					? html`<span class="is-on"></span>`
					: html`<span></span>`
		);
	}

	private renderMission(
		mission: Mission,
		index: number
	): TemplateResult {
		const selected =
			index === this.selectedIndex;

		const body = html`
			<span class="status-dot"></span>
			<div>
				<strong>${mission.title}</strong>
				<small>${mission.area} · impact ${mission.score}/10</small>
			</div>
			<button class="mission-select" type="button">Select</button>
		`;

		if (
			mission.status === "done"
		) {
			return selected
				? html`<article class="mission mission--done mission--selected">${body}</article>`
				: html`<article class="mission mission--done">${body}</article>`;
		}

		if (
			mission.status === "active"
		) {
			return selected
				? html`<article class="mission mission--active mission--selected">${body}</article>`
				: html`<article class="mission mission--active">${body}</article>`;
		}

		return selected
			? html`<article class="mission mission--selected">${body}</article>`
			: html`<article class="mission">${body}</article>`;
	}

	private renderInspector(
		selected:
			| Mission
			| undefined
	): TemplateResult {
		const telemetry =
			this.plugin(
				TelemetryPlugin
			).snapshot;

		if (!selected) {
			return html`
				<p class="section-title">Inspector</p>
				<h3>No mission selected</h3>
				<p>Adjust the filter or search to bring a mission back into view.</p>
			`;
		}

		return html`
			<p class="section-title">Inspector</p>
			<h3>${selected.title}</h3>
			<p>
				This panel is rendered from the same reactive state, while plugin
				telemetry is read through Component.plugin().
			</p>

			<div class="progress">
				${this.progressSegments(selected.score)}
			</div>

			<div class="detail-card">
				<div class="detail-row">
					<span>Area</span>
					<strong>${selected.area}</strong>
				</div>
				<div class="detail-row">
					<span>Status</span>
					<strong>${selected.status}</strong>
				</div>
				<div class="detail-row">
					<span>Mode</span>
					<strong>${this.mode}</strong>
				</div>
				<div class="detail-row">
					<span>Plugin</span>
					<strong>${telemetry.label}</strong>
				</div>
				<div class="detail-row">
					<span>Render #</span>
					<strong>${telemetry.renders}</strong>
				</div>
				<div class="detail-row">
					<span>Previous render</span>
					<strong>${telemetry.lastRenderMs.toFixed(2)} ms</strong>
				</div>
				<div class="detail-row">
					<span>Plugin uptime</span>
					<strong>${Math.round(telemetry.uptimeMs)} ms</strong>
				</div>
			</div>

			<p class="section-title">Recent lifecycle / state activity</p>
			<div class="activity">
				${this.activity.map(
					entry =>
						html`<div class="activity-item">${entry}</div>`
				)}
			</div>
		`;
	}

	protected override render(): TemplateResult {
		const visible =
			this.visibleMissions();

		const selected =
			visible[
				Math.min(
					this.selectedIndex,
					Math.max(
						visible.length - 1,
						0
					)
				)
			]?.mission;

		return html`
			<section class="frame">
				<header class="topbar">
					<div class="brand">
						<span class="brand__mark">I</span>
						<span class="brand__copy">
							<strong>Ion Mission Control</strong>
							<small>one component · many framework surfaces</small>
						</span>
					</div>

					<div class="topbar__actions">
						<span class="pill">mode: ${this.mode}</span>
						<button class="action" data-action="mode" type="button">Cycle mode</button>
						<button class="action" data-action="compact" type="button">Density</button>
					</div>
				</header>

				<div class="layout">
					<aside class="sidebar">
						<p class="section-title">Live state</p>

						<div class="metric-grid">
							<div class="metric">
								<strong>${this.missions.length}</strong>
								<small>missions</small>
							</div>
							<div class="metric">
								<strong>${this.count("done")}</strong>
								<small>done</small>
							</div>
							<div class="metric">
								<strong>${this.count("active")}</strong>
								<small>active</small>
							</div>
							<div class="metric">
								<strong>${this.plugins.length}</strong>
								<small>plugins</small>
							</div>
						</div>

						<p class="section-title">Cached shortcut map</p>

						<div class="shortcut-list">
							${this.shortcutLegend.map(
								([ key, label ]) =>
									html`
										<div class="shortcut">
											<span>${label}</span>
											<kbd>${key}</kbd>
										</div>
									`
							)}
						</div>
					</aside>

					<main class="main">
						<div class="main-head">
							<div>
								<p class="section-title">Reactive mission queue</p>
								<h2>Ship the hard parts</h2>
								<p>
									Filter, search, mutate, disconnect and reconnect this component.
								</p>
							</div>

							<div class="command-row">
								<button class="action" data-action="advance" type="button">Advance</button>
								<button class="action" data-action="add" type="button">Add</button>
								<button class="action" data-action="reset" type="button">Reset</button>
							</div>
						</div>

						<div class="filters">
							<button class="filter" data-filter="all" type="button">All ${this.missions.length}</button>
							<button class="filter" data-filter="todo" type="button">Todo ${this.count("todo")}</button>
							<button class="filter" data-filter="active" type="button">Active ${this.count("active")}</button>
							<button class="filter" data-filter="done" type="button">Done ${this.count("done")}</button>
						</div>

						<input
							id="search"
							class="search"
							type="search"
							placeholder="Search mission or subsystem…  (press /)"
							autocomplete="off"
						/>

						<div class="missions">
							${visible.length
								? visible.map(
									({ mission }, index) =>
										this.renderMission(
											mission,
											index
										)
								)
								: html`
									<div class="empty">
										No mission matches the current filter.
									</div>
								`
							}
						</div>
					</main>

					<aside class="inspector">
						${this.renderInspector(selected)}
					</aside>
				</div>
			</section>
		`;
	}
}

MissionControl.use(
	TelemetryPlugin,
	{
		label:
			"Ion plugin runtime"
	}
);

let scopedRenderCount = 0;

hok.afterFor(
	MissionControl,
	"render",
	host => {
		scopedRenderCount++;

		host.setAttribute(
			"data-hook-renders",
			String(
				scopedRenderCount
			)
		);
	},
	"playground:mission:render"
);
