import {
	mkdtempSync,
	mkdirSync,
	readdirSync,
	rmSync,
	writeFileSync
} from "node:fs";

import { tmpdir } from "node:os";

import {
	join,
	relative
} from "node:path";

import {
	spawnSync
} from "node:child_process";

import {
	fileURLToPath
} from "node:url";

import {
	build
} from "vite";

const root = fileURLToPath(
	new URL(
		"..",
		import.meta.url
	)
);

const work =
	mkdtempSync(
		join(
			tmpdir(),
			"ion-package-smoke-"
		)
	);

const packDirectory =
	join(work, "pack");

const consumerDirectory =
	join(work, "consumer");

mkdirSync(packDirectory);
mkdirSync(consumerDirectory);

function run(
	command: string,
	args: string[],
	cwd: string
): void {
	const result = spawnSync(
		command,
		args,
		{
			cwd,
			stdio: "inherit",
			shell:
				process.platform ===
				"win32"
		}
	);

	if (result.status !== 0) {
		throw new Error(
			`[ION::PACKAGE] Command failed: ${command} ${args.join(" ")}`
		);
	}
}

try {
	run(
		"pnpm",
		[
			"pack",
			"--pack-destination",
			packDirectory
		],
		root
	);

	const tarballName =
		readdirSync(
			packDirectory
		).find(
			name =>
				name.endsWith(".tgz")
		);

	if (!tarballName) {
		throw new Error(
			"[ION::PACKAGE] pnpm pack did not produce a tarball."
		);
	}

	const tarball =
		join(
			packDirectory,
			tarballName
		);

	const relativeTarball =
		relative(
			consumerDirectory,
			tarball
		).replaceAll(
			"\\",
			"/"
		);

	writeFileSync(
		join(
			consumerDirectory,
			"package.json"
		),
		JSON.stringify(
			{
				name:
					"ion-package-smoke",

				private: true,

				type: "module",

				dependencies: {
					"@gottheflag/ion":
						`file:${relativeTarball}`
				}
			},
			null,
			"\t"
		)
	);

	writeFileSync(
		join(
			consumerDirectory,
			"tsconfig.json"
		),
		JSON.stringify(
			{
				compilerOptions: {
					target: "ES2023",

					module: "ESNext",

					moduleResolution:
						"Bundler",

					strict: true,

					noEmit: true,

					lib: [
						"ES2023",
						"DOM"
					],

					experimentalDecorators:
						true,

					useDefineForClassFields:
						false
				},

				include: [
					"consumer.ts"
				]
			},
			null,
			"\t"
		)
	);

	writeFileSync(
		join(
			consumerDirectory,
			"consumer.ts"
		),
		`
import {
	Component,
	Ion
} from "@gottheflag/ion";
import { html } from "@gottheflag/ion/template";
import { once } from "@gottheflag/ion/decorators";
import { Plugin } from "@gottheflag/ion/plugin";
import { hok } from "@gottheflag/ion/hook";

class SmokePlugin extends Plugin {}

class SmokeComponent extends Component {
	protected render() {
		return html\`<div>Ion package smoke</div>\`;
	}
}

Ion.create(
	SmokeComponent,
	"ion-smoke-direct"
);

@Ion.create(
	"ion-smoke-decorator"
)
class DecoratedSmokeComponent
	extends Component {}

SmokeComponent.use(SmokePlugin);

export {
	Component,
	Ion,
	Plugin,
	SmokeComponent,
	DecoratedSmokeComponent,
	SmokePlugin,
	hok,
	html,
	once
};
`
	);

	run(
		"pnpm",
		[
			"install"
		],
		consumerDirectory
	);

	run(
		"pnpm",
		[
			"exec",
			"tsc",
			"-p",
			join(
				consumerDirectory,
				"tsconfig.json"
			)
		],
		root
	);

	const result =
		await build({
			root:
				consumerDirectory,

			configFile:
				false,

			build: {
				write:
					false,

				minify:
					true,

				lib: {
					entry:
						join(
							consumerDirectory,
							"consumer.ts"
						),

					formats: [
						"es"
					]
				}
			}
		});

	const outputs =
		Array.isArray(result)
			? result.flatMap(
				item =>
					item.output
			)
			: result.output;

	const chunk =
		outputs.find(
			output =>
				output.type ===
				"chunk"
		);

	if (
		!chunk ||
		chunk.type !== "chunk"
	) {
		throw new Error(
			"[ION::PACKAGE] Consumer bundle produced no JavaScript chunk."
		);
	}

	const modules =
		Object.keys(
			chunk.modules
		).map(
			module =>
				module.replaceAll(
					"\\",
					"/"
				)
		);

	const packagedIon =
		modules.some(
			module =>
				module.includes(
					"/node_modules/@gottheflag/ion/dist/"
				)
		);

	const pluginInstaller =
		modules.some(
			module =>
				module.endsWith(
					"/dist/plugin/install.js"
				)
		);

	if (!packagedIon) {
		throw new Error(
			"[ION::PACKAGE] Consumer did not bundle the packed Ion package."
		);
	}

	if (!pluginInstaller) {
		throw new Error(
			"[ION::PACKAGE] Plugin installer was removed during consumer bundling."
		);
	}

	console.log(
		"[ION::PACKAGE] packed consumer typecheck: ok"
	);

	console.log(
		"[ION::PACKAGE] packed consumer bundle: ok"
	);

	console.log(
		"[ION::PACKAGE] plugin installer preserved: true"
	);
} finally {
	rmSync(
		work,
		{
			recursive: true,
			force: true
		}
	);
}