import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CometChatUsers } from '../CometChatUsers';

// --- Mock SDK ---
vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    UsersRequestBuilder: vi.fn(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setSearchKeyword: vi.fn().mockReturnThis(),
      build: vi.fn(() => ({ fetchNext: vi.fn().mockResolvedValue([]) })),
    })),
    UserListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    ConnectionListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
  },
}));

describe('CometChatUsers.Root', () => {
  it('renders the users container with region role', () => {
    render(<CometChatUsers.Root />);
    expect(screen.getByRole('region', { name: 'Users' })).toBeInTheDocument();
  });

  it('renders default layout when no children provided', () => {
    render(<CometChatUsers.Root />);
    // Default layout includes header with "Users" title
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('renders custom children when provided', () => {
    render(
      <CometChatUsers.Root>
        <div data-testid="custom-child">Custom Content</div>
      </CometChatUsers.Root>
    );
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    // Default header should NOT be rendered
    expect(screen.queryByRole('heading', { name: 'Users' })).not.toBeInTheDocument();
  });
});
