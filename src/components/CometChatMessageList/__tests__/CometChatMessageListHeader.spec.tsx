import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatMessageListHeader } from '../CometChatMessageListHeader';

describe('CometChatMessageListHeader', () => {
  it('returns null when no children are provided', () => {
    const { container } = render(<CometChatMessageListHeader />);
    expect(container).toBeEmptyDOMElement();
  });

  it('wraps children in the header slot when provided', () => {
    render(
      <CometChatMessageListHeader>
        <button type="button">Call</button>
      </CometChatMessageListHeader>
    );
    expect(screen.getByRole('button', { name: 'Call' })).toBeInTheDocument();
  });

  it('has the correct display name', () => {
    expect(CometChatMessageListHeader.displayName).toBe('CometChatMessageListHeader');
  });
});
