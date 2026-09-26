import { fileURLToPath } from "node:url";
import { build } from "vite";

async function bundle(
	file: string
) {
	const entry = fileURLToPath(
		new URL(
			`../tests/fixtures/${file}`,
			import.meta.url
		)
	);

	const result = await build({
		configFile: false,

		build: {
			write: false,
			minify: true,

			lib: {
				entry,
				formats: [ "es" ]
			},

			rollupOptions: {
				external: [
					"@gottheflag/lifecycle"
				]
			}
		}
	});

	const outputs =
		Array.isArray(result)
			? result.flatMap(
				result => result.output
			)
			: result.output;

	const chunk = outputs.find(
		output =>
			output.type === "chunk"
	);

	if (
		!chunk ||
		chunk.type !== "chunk"
	) {
		throw new Error(
			"[ION::BUNDLE] No JavaScript chunk was produced."
		);
	}

	const bytes =
		Buffer.byteLength(
			chunk.code,
			"utf8"
		);

	const pluginRuntimeIncluded =
		Object.keys(chunk.modules)
			.some(module =>
				module
					.replaceAll("\\", "/")
					.includes("/src/plugin/")
			);

	return {
		bytes,
		pluginRuntimeIncluded
	};
}

const minimal =
	await bundle(
		"minimal-consumer.ts"
	);

const plugin =
	await bundle(
		"plugin-consumer.ts"
	);

console.log(
	`[ION::BUNDLE] minimal consumer: ${minimal.bytes} bytes`
);

console.log(
	`[ION::BUNDLE] minimal plugin runtime included: ${minimal.pluginRuntimeIncluded}`
);

console.log(
	`[ION::BUNDLE] plugin consumer: ${plugin.bytes} bytes`
);

console.log(
	`[ION::BUNDLE] plugin consumer runtime included: ${plugin.pluginRuntimeIncluded}`
);

if (
	minimal.pluginRuntimeIncluded
) {
	throw new Error(
		"[ION::BUNDLE] Plugin subsystem leaked into the minimal bundle."
	);
}

if (
	!plugin.pluginRuntimeIncluded
) {
	throw new Error(
		"[ION::BUNDLE] Plugin consumer did not include the plugin subsystem."
	);
}