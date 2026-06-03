import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useCometChatMessageInformationContext } from '../CometChatMessageInformation.context';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    RECEIVER_TYPE: { GROUP: 'group', USER: 'user' },
  },
}));

describe('useCometChatMessageInformationContext', () => {
  it('throws when used outside of CometChatMessageInformation.Root', () => {
    function BadConsumer() {
      useCometChatMessageInformationContext();
      return <div />;
    }

    // Suppress React error boundary console output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<BadConsumer />)).toThrow(
      'useCometChatMessageInformationContext must be used within <CometChatMessageInformation.Root>'
    );

    consoleSpy.mockRestore();
  });
});
