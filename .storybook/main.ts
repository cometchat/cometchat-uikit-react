import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: '@storybook/react-vite',
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  staticDirs: [
    { from: './avatars', to: '/avatars' },
  ],
  viteFinal: (config) => {
    return config;
  },
};

export default config;
