const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');
const production = process.argv.includes('--production');

/**
 * Bundles the extension host into a single `out/extension.js`.
 *
 * Why bundle at all: VS Code loads an unbundled extension file by file, which is slower on
 * activation, and the official guidance is that unbundled extensions can't run in VS Code
 * for the Web at all.
 *
 * `undici` stays EXTERNAL on purpose. It ships its llhttp parser as `.wasm` files that it
 * loads relative to its own `__dirname`; bundling it would break that lookup, and proxy
 * support plus "disable SSL verification" would silently stop working — a bug this repo has
 * already shipped once. It is a real `dependencies` entry and keeps its `.vscodeignore`
 * negations. `vscode` is external because the runtime provides it.
 */
const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode', 'undici'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: !production,
  minify: production,
  logLevel: 'info',
};

async function main() {
  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('[esbuild] watching src/…');
    return;
  }
  await esbuild.build(buildOptions);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
