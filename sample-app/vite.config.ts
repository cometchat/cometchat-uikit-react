import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite';
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

export default defineConfig(({ mode }) => {
  // Vite doesn't load .env files into process.env before this config is evaluated,
  // so UIKIT_LOCAL sitting in sample-app/.env would be invisible here. Read it
  // explicitly: '' loads all vars (not just VITE_-prefixed ones). An inline shell
  // var (UIKIT_LOCAL=1 npm run dev) still takes precedence via process.env.
  const env = loadEnv(mode, __dirname, '');
  const useLocalUIKit = (process.env.UIKIT_LOCAL ?? env.UIKIT_LOCAL) === '1';

  return {
    plugins: [optionalPeerDependency(CALLS_SDK), react()],
    resolve: {
      // Ensure shared dependencies resolve to a single copy — prevents instanceof
      // failures when the UIKit source (aliased from ../src) and the sample app
      // both import the same package from different locations on disk.
      dedupe: ['@cometchat/chat-sdk-javascript', 'react', 'react-dom'],
      // UIKIT_LOCAL=1 resolves the UIKit from ../src instead of the installed
      // @cometchat/chat-uikit-react package, so the sample app (and the E2E suite)
      // exercise local UI Kit changes rather than the last published release.
      alias: useLocalUIKit
        ? [
            {
              find: '@cometchat/chat-uikit-react/styles',
              replacement: resolve(__dirname, '../src/styles/index.css'),
            },
            {
              find: /^@cometchat\/chat-uikit-react\/(.+)$/,
              replacement: resolve(__dirname, '../src/$1'),
            },
            {
              find: '@cometchat/chat-uikit-react',
              replacement: resolve(__dirname, '../src'),
            },
          ]
        : [],
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
  };
});
