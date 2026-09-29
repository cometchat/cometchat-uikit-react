/**
 * The URL of an imported image asset.
 *
 * Vite, Create React App and rollup resolve `import icon from './icon.svg'` to a URL string, but
 * Next.js (webpack and Turbopack) resolves it to `{ src, width, height }`. Normalising at the import
 * keeps this folder usable in all of them without bundler configuration.
 */
export const assetUrl = (asset: string | { src: string }): string =>
  typeof asset === 'string' ? asset : asset.src;
