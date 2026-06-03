import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    rules: {
      // TypeScript strict
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',

      // React hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Accessibility
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',

      // Import
      'import/no-cycle': 'error',

      // No barrel imports inside the library
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../index', '../index', './index'],
              message: 'Import directly from source, not from barrel index files.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.spec.{ts,tsx}', 'src/**/*.test.{ts,tsx}', 'src/**/*.stories.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'sample-app-old/', 'sample-app/', 'v6/', 'uikit-react-v6/', '.storybook/', '*.config.*'],
  },
);
