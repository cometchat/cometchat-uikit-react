import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatTooltip } from '../CometChatTooltip';

/** Create an anchor element attached to the document body. */
function makeAnchor(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

describe('CometChatTooltip', () => {
  it('renders nothing when there is no anchor', () => {
    render(<CometChatTooltip anchorEl={null}>Too large</CometChatTooltip>);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('portals a tooltip with the given content and base class', () => {
    const anchor = makeAnchor();
    render(<CometChatTooltip anchorEl={anchor}>File too large</CometChatTooltip>);

    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('File too large');
    expect(tip.className).toContain('cometchat-tooltip');
    // Portaled to <body>, not nested inside the anchor.
    expect(anchor.contains(tip)).toBe(false);
    expect(document.body.contains(tip)).toBe(true);
  });

  it('applies an arrow-variant modifier class', () => {
    const anchor = makeAnchor();
    render(<CometChatTooltip anchorEl={anchor}>x</CometChatTooltip>);

    const tip = screen.getByRole('tooltip');
    expect(tip.className).toMatch(/cometchat-tooltip--arrow-(left|middle|right)/);
  });

  it('forwards an extra className', () => {
    const anchor = makeAnchor();
    render(
      <CometChatTooltip anchorEl={anchor} className="my-tooltip">
        x
      </CometChatTooltip>
    );
    expect(screen.getByRole('tooltip').className).toContain('my-tooltip');
  });
});
