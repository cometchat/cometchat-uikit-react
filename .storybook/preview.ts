import type { Preview } from '@storybook/react';
import React from 'react';
import '../src/styles/index.css';
import { LocaleProvider } from '../src/context/locale/LocaleProvider';
import { withTheme } from './decorators/theme.decorator';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    docs: {
      toc: true,
    },
    backgrounds: {
      disable: true, // Disable default backgrounds since we use theme switching
    },
    options: {
      storySort: {
        order: [
          'Components',
          [
            'Conversations',
            'Messages',
            'Bubbles',
            'Users',
            'Groups',
            'Calls',
            'AI',
            'Misc',
          ],
          'Base Elements',
        ],
      },
    },
  },
  decorators: [
    withTheme,
    (Story) => React.createElement(LocaleProvider, null, React.createElement(Story)),
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
