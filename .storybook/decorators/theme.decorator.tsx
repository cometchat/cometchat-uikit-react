import React, { useEffect } from 'react';
import type { Decorator } from '@storybook/react';

/**
 * Theme decorator for Storybook stories.
 *
 * Applies the data-theme attribute to document root, body, and Storybook
 * elements to enable CSS variable theming for light/dark mode switching.
 * Also ensures the Roboto font is applied globally for consistency.
 * Controlled via the global toolbar theme selector.
 */
export const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals?.['theme'] as string) || 'light';

  useEffect(() => {
    // Apply theme to document root and body
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);

    // Ensure Roboto font is applied globally
    document.body.style.fontFamily = "var(--cometchat-font-family, 'Roboto', 'Inter', sans-serif)";

    // Apply to Storybook root
    const storybookRoot = document.getElementById('storybook-root');
    if (storybookRoot) {
      storybookRoot.setAttribute('data-theme', theme);
      storybookRoot.style.fontFamily = "var(--cometchat-font-family, 'Roboto', 'Inter', sans-serif)";
    }

    // Apply to Storybook main content area
    const sbMain = document.querySelector('.sb-show-main');
    if (sbMain) {
      sbMain.setAttribute('data-theme', theme);
    }

    // Apply to docs wrapper and story blocks
    const sbdocsWrapper = document.querySelector('.sbdocs-wrapper');
    if (sbdocsWrapper) {
      sbdocsWrapper.setAttribute('data-theme', theme);
    }

    document.querySelectorAll('.docs-story').forEach(el => {
      el.setAttribute('data-theme', theme);
    });

    // Set background color based on theme
    const bg = theme === 'dark' ? '#1a1a1a' : '#e8e8e8';
    document.body.style.backgroundColor = bg;
    if (storybookRoot) {
      storybookRoot.style.backgroundColor = bg;
    }

    // Colour the story preview blocks inside docs
    document.querySelectorAll('.docs-story').forEach(el => {
      (el as HTMLElement).style.backgroundColor = bg;
    });
  }, [theme]);

  return <Story />;
};
