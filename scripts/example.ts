import { spawnSync } from "node:child_process";

const name = process.argv[2];

if (!name) {
	console.error("Please provide an example name.");
	process.exit(1);
}

spawnSync("vite", ["serve", `examples/${name}`], {
	stdio: "inherit",
	shell: true
});