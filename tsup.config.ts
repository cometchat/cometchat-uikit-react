import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: true,
  tsconfig: 'tsconfig.build.json',
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@cometchat/chat-sdk-javascript',
    '@cometchat/calls-sdk-javascript',
  ],
  // Auto-inject CSS when JS is imported by consumers
  banner(ctx) {
    if (ctx.format === 'esm') {
      return { js: "import './index.css';" };
    }
    return { js: "require('./index.css');" };
  },
  loader: {
    '.svg': 'dataurl',
    '.png': 'dataurl',
  },
  onSuccess: 'node scripts/copy-assets.js',
});
