import esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

const context = await esbuild.context({
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: ["obsidian", "electron", "@codemirror/state", "@codemirror/view"],
	format: "cjs",
	target: "es2020",
	outfile: "main.js",
	sourcemap: isWatch ? "inline" : false,
	logLevel: "info",
	platform: "node",
});

if (isWatch) {
	await context.watch();
} else {
	await context.rebuild();
	await context.dispose();
}
