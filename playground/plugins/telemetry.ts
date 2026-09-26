import {
	Plugin,
	withDefaults
} from "../../src/plugin/index.js";

import type {
	MissionControl
} from "../components/mission-control.js";

type TelemetryOptions = {
	label?: string;
};

type TelemetrySnapshot = {
	label: string;
	renders: number;
	lastRenderMs: number;
	uptimeMs: number;
};

export class TelemetryPlugin extends Plugin<
	MissionControl,
	TelemetryOptions
> {
	static id = "playground:telemetry";

	#createdAt = 0;
	#renderStartedAt = 0;
	#renderCount = 0;
	#lastRenderMs = 0;

	#config = withDefaults(
		this.options,
		{
			label: "Ion POC"
		}
	);

	get snapshot(): TelemetrySnapshot {
		return {
			label: this.#config.label,
			renders: this.#renderCount,
			lastRenderMs: this.#lastRenderMs,
			uptimeMs:
				this.#createdAt === 0
					? 0
					: performance.now() - this.#createdAt
		};
	}

	protected created(): void {
		this.#createdAt = performance.now();
	}

	protected beforeRender(): void {
		this.#renderCount++;
		this.#renderStartedAt = performance.now();
	}

	protected afterRender(): void {
		this.#lastRenderMs =
			performance.now() -
			this.#renderStartedAt;
	}

	protected ready(): void {
		this.host.attr(
			"data-telemetry-ready",
			true
		);
	}

	protected removed(): void {
		console.info(
			"[PLAYGROUND::TELEMETRY]",
			"plugin lifetime ended",
			this.snapshot
		);
	}
}
