/**
 * Post-build script: copies theme styles to dist/.
 *
 * tsup handles:
 * - JS/CSS bundling (dist/index.js, dist/index.css)
 * - SVG/PNG inlining as data URLs (loader: { '.svg': 'dataurl', '.png': 'dataurl' })
 * - Font files referenced by CSS (hashed woff2 in dist/)
 *
 * This script only exists to support the optional `./styles` package.json export,
 * which lets consumers import styles via CSS (@import) rather than relying on the
 * automatic JS-based CSS injection (banner: import './index.css').
 *
 * Run automatically by tsup via the `onSuccess` hook.
 */

import { existsSync, mkdirSync, cpSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Copy src/styles → dist/styles (theme variables, fonts.css, dark/light themes)
const srcStyles = resolve(root, 'src/styles');
const destStyles = resolve(root, 'dist/styles');

if (existsSync(srcStyles)) {
  mkdirSync(destStyles, { recursive: true });
  cpSync(srcStyles, destStyles, { recursive: true });
  console.log('[copy-assets] Copied: src/styles → dist/styles');
} else {
  console.warn('[copy-assets] Warning: src/styles not found');
}

console.log('[copy-assets] Done.');
