import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatListItem } from '../CometChatListItem';

/**
 * Helper: renders Subtitle inside Root (required for context).
 */
function renderSubtitle(
  props: Partial<React.ComponentProps<typeof CometChatListItem.Subtitle>> = {},
  children: React.ReactNode = 'Online'
) {
  return render(
    <CometChatListItem.Root>
      <CometChatListItem.Title>Title</CometChatListItem.Title>
      <CometChatListItem.Subtitle {...props}>{children}</CometChatListItem.Subtitle>
    </CometChatListItem.Root>
  );
}

describe('CometChatListItemSubtitle', () => {
  it('renders text children', () => {
    renderSubtitle({}, 'Online');
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders ReactNode children', () => {
    renderSubtitle({}, <em data-testid="custom-sub">Typing...</em>);
    expect(screen.getByTestId('custom-sub')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    renderSubtitle({ className: 'my-subtitle-class' }, 'Away');
    const el = screen.getByText('Away');
    expect(el.className).toContain('my-subtitle-class');
  });

  it('renders without custom className', () => {
    renderSubtitle({}, 'Offline');
    const el = screen.getByText('Offline');
    expect(el).toBeInTheDocument();
    expect(el.className.length).toBeGreaterThan(0);
  });

  it('renders alongside Title in the title container', () => {
    render(
      <CometChatListItem.Root>
        <CometChatListItem.Title>John Doe</CometChatListItem.Title>
        <CometChatListItem.Subtitle>Last seen 5m ago</CometChatListItem.Subtitle>
      </CometChatListItem.Root>
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Last seen 5m ago')).toBeInTheDocument();
  });
});
