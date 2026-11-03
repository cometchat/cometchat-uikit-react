import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cometchat/chat-uikit-react': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.spec.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'json-summary', 'html', 'lcov'],
      // Without this a run with any failing test writes no report at all.
      reportOnFailure: true,
      include: ['src/**/*.{ts,tsx}'],
      // The coverage denominator: everything under src/ except what has no logic
      // to test. Every exclusion carries its reason; behaviour (hooks, managers,
      // Root components, named components) is never excluded.
      exclude: [
        'src/**/*.spec.{ts,tsx}', // tests
        'src/**/*.test.{ts,tsx}', // tests
        'src/**/__tests__/**', // test helpers next to the tests
        'src/**/*.stories.{ts,tsx}', // Storybook stories
        'src/**/*.e2e.{ts,tsx}', // end-to-end tests
        'src/testing/**', // test fixtures and mocks
        'src/**/index.ts', // re-export barrels (plugins/core: a literal plugin list)
        'src/**/*.lazy.ts', // one-line default re-exports for React.lazy
        'src/**/*.d.ts', // ambient type declarations
        'src/**/*.types.ts', // types, enums and literal defaults; no branches
        '!src/components/CometChatAIAssistantChat/ai.types.ts', // …except this one: CometChatAIAssistantTools has behaviour
        'src/constants/Enums.ts', // literal maps
        'src/components/base/CometChatEmojiKeyboard/CometChatEmojiData.ts', // 7,000-line data table
        'src/components/CometChatAudioBubble/wavesurfer/**', // vendored third-party port, not modified here
      ],
      // Floors just under the measured coverage on this denominator (lines 91.91%,
      // branches 88.01%, functions 88.06%); branches and functions sit half a point under, as
      // 88 would leave a margin of two branches. They only ever go up; the target is 90% lines,
      // 95% the stretch.
      thresholds: {
        lines: 91,
        functions: 87.5,
        branches: 87.5,
        statements: 91,
      },
    },
  },
});
