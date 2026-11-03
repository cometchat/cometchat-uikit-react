import { defineConfig } from 'tsup';

/**
 * Library build. One source tree, two module formats:
 *
 *   dist/index.js    ESM       (`import`)  — Vite, Next.js, React Router, webpack 5
 *   dist/index.cjs   CommonJS  (`require`) — Jest and older tooling
 *   dist/index.d.ts  types for the ESM build
 *   dist/index.d.cts types for the CommonJS build
 *   dist/index.css   all component styles (also exported as `@cometchat/chat-uikit-react/styles`)
 *
 * Which file a consumer gets is decided by `exports` / `main` / `module` / `types` in
 * package.json, not here. Because package.json has `"type": "module"`, `.js` files are ESM
 * and `.cjs` files are CommonJS.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // Emits index.d.ts and, for the CommonJS format, index.d.cts.
  dts: true,
  sourcemap: false,
  clean: true,
  treeshake: true,
  // Shared code goes into chunk-*.js files so both entry points and the lazy chunks
  // reuse it instead of duplicating it.
  splitting: true,
  tsconfig: 'tsconfig.build.json',
  // Peer dependencies: the consumer's own copies are used, never bundled.
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@cometchat/chat-sdk-javascript',
    '@cometchat/calls-sdk-javascript',
  ],
  // Import the stylesheet from the JS entry so styles load without a separate CSS import.
  // Bundlers handle this; tools that load the package through plain Node (Vitest's default
  // dependency handling, Jest) need to be told to process or stub CSS.
  banner(ctx) {
    if (ctx.format === 'esm') {
      return { js: "import './index.css';" };
    }
    return { js: "require('./index.css');" };
  },
  // Icons and images are inlined as data URLs, so the package ships no loose image files.
  loader: {
    '.svg': 'dataurl',
    '.png': 'dataurl',
  },
  onSuccess: 'node scripts/copy-assets.js',
});
