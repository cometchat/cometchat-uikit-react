import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Check if an optional package is installed without throwing. */
function isPackageInstalled(pkg: string): boolean {
  try {
    require.resolve(pkg);
    return true;
  } catch {
    return false;
  }
}

const CALLS_SDK = '@cometchat/calls-sdk-javascript';
const callsSDKInstalled = isPackageInstalled(CALLS_SDK);

/**
 * Vite plugin that gracefully handles optional peer dependencies.
 * When a listed package is not installed, it resolves to a virtual empty
 * module instead of throwing a build-time "Failed to resolve import" error.
 * The consuming code is responsible for checking null at runtime.
 */
function optionalPeerDependency(...packageNames: string[]) {
  return {
    name: 'vite-plugin-optional-peer-dependency',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (!packageNames.includes(id)) return undefined;
      if (isPackageInstalled(id)) return undefined; // installed — let Vite resolve normally
      return `\0virtual:optional-empty:${id}`; // not installed — use virtual module
    },
    load(id: string) {
      if (id.startsWith('\0virtual:optional-empty:')) {
        // Return an empty module so dynamic imports resolve to {} instead of throwing
        return 'export default null; export const CometChatCalls = null;';
      }
      return undefined;
    },
  };
}

export default defineConfig({
  plugins: [optionalPeerDependency(CALLS_SDK), react()],
  resolve: {
    // Ensure shared dependencies resolve to a single copy — prevents instanceof
    // failures when the UIKit source (aliased from ../src) and the sample app
    // both import the same package from different locations on disk.
    dedupe: ['@cometchat/chat-sdk-javascript', 'react', 'react-dom'],
    alias: [
      // Uncomment below to use local UIKit source instead of the installed package:
      // {
      //   find: '@cometchat/chat-uikit-react/styles',
      //   replacement: resolve(__dirname, '../src/styles/index.css'),
      // },
      // {
      //   find: /^@cometchat\/chat-uikit-react\/(.+)$/,
      //   replacement: resolve(__dirname, '../src/$1'),
      // },
      // {
      //   find: '@cometchat/chat-uikit-react',
      //   replacement: resolve(__dirname, '../src'),
      // },
    ],
  },
  optimizeDeps: {
    // Only include for pre-bundling when actually installed.
    // When not installed, exclude it so Vite doesn't warn about unresolvable deps.
    ...(callsSDKInstalled ? { include: [CALLS_SDK] } : { exclude: [CALLS_SDK] }),
  },
  server: {
    port: 3005,
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), '..'],
    },
  },
});
