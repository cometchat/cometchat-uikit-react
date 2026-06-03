import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatListItem } from '../CometChatListItem';

/**
 * Helper: renders LeadingView inside Root.
 */
function renderLeadingView(
  props: Partial<React.ComponentProps<typeof CometChatListItem.LeadingView>> = {},
  children: React.ReactNode = <img src="avatar.png" alt="avatar" />
) {
  return render(
    <CometChatListItem.Root>
      <CometChatListItem.LeadingView {...props}>{children}</CometChatListItem.LeadingView>
      <CometChatListItem.Title>Title</CometChatListItem.Title>
    </CometChatListItem.Root>
  );
}

describe('CometChatListItemLeadingView', () => {
  it('renders children', () => {
    renderLeadingView({}, <span data-testid="avatar-icon">AV</span>);
    expect(screen.getByTestId('avatar-icon')).toBeInTheDocument();
  });

  it('renders an image child', () => {
    renderLeadingView();
    expect(screen.getByAltText('avatar')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    renderLeadingView({ className: 'my-leading-class' }, <span>AV</span>);
    const el = screen.getByText('AV').parentElement!;
    expect(el.className).toContain('my-leading-class');
  });

  it('renders without custom className', () => {
    renderLeadingView({}, <span>AV</span>);
    const el = screen.getByText('AV').parentElement!;
    expect(el).toBeInTheDocument();
    expect(el.className.length).toBeGreaterThan(0);
  });

  it('is placed before the body in the DOM', () => {
    const { container } = render(
      <CometChatListItem.Root>
        <CometChatListItem.LeadingView>
          <span data-testid="lead">Lead</span>
        </CometChatListItem.LeadingView>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
      </CometChatListItem.Root>
    );
    const root = container.firstElementChild!;
    const leadingView = screen.getByTestId('lead').parentElement!;
    // LeadingView should be the first child of the root
    expect(root.firstElementChild).toBe(leadingView);
  });
});
