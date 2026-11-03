import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ─── Mock Root + sub-components ──────────────────────────────────────────────
// The mocked Root renders the views it receives through context, so these tests can assert
// delegation without the SDK stack; the layout itself is covered against the real Root in
// CometChatMessageInformation.props.spec.tsx.
vi.mock('../CometChatMessageInformationRoot', () => ({
  CometChatMessageInformationRoot: vi.fn(({ children }: { children?: React.ReactNode }) => {
    const views = React.useContext(CometChatMessageInformationViewsContext);
    return (
      <div data-testid="root">
        {children}
        {Object.entries(views).map(([name, view]) => (
          <React.Fragment key={name}>{view}</React.Fragment>
        ))}
      </div>
    );
  }),
}));
vi.mock('../CometChatMessageInformationHeader', () => ({
  CometChatMessageInformationHeader: () => <div data-testid="header" />,
}));
vi.mock('../CometChatMessageInformationMessagePreview', () => ({
  CometChatMessageInformationMessagePreview: () => <div data-testid="preview" />,
}));
vi.mock('../CometChatMessageInformationReceiptList', () => ({
  CometChatMessageInformationReceiptList: () => <div data-testid="receipt-list" />,
}));
vi.mock('../CometChatMessageInformationLoadingState', () => ({
  CometChatMessageInformationLoadingState: () => <div data-testid="loading" />,
}));
vi.mock('../CometChatMessageInformationErrorState', () => ({
  CometChatMessageInformationErrorState: () => <div data-testid="error" />,
}));
vi.mock('../CometChatMessageInformationEmptyState', () => ({
  CometChatMessageInformationEmptyState: () => <div data-testid="empty" />,
}));

import { CometChatMessageInformation } from '../CometChatMessageInformation';
import { CometChatMessageInformationViewsContext } from '../CometChatMessageInformation.context';
import { CometChatMessageInformationRoot } from '../CometChatMessageInformationRoot';
import { CometChatMessageInformationHeader } from '../CometChatMessageInformationHeader';
import { CometChatMessageInformationMessagePreview } from '../CometChatMessageInformationMessagePreview';
import { CometChatMessageInformationReceiptList } from '../CometChatMessageInformationReceiptList';
import { CometChatMessageInformationLoadingState } from '../CometChatMessageInformationLoadingState';
import { CometChatMessageInformationErrorState } from '../CometChatMessageInformationErrorState';
import { CometChatMessageInformationEmptyState } from '../CometChatMessageInformationEmptyState';
import { buildTextMessage } from '../../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

const message = buildTextMessage({ text: 'hi' }) as unknown as CometChat.BaseMessage;

describe('CometChatMessageInformation (flat)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compound API surface', () => {
    it('exposes Root and all sub-components', () => {
      expect(CometChatMessageInformation.Root).toBe(CometChatMessageInformationRoot);
      expect(CometChatMessageInformation.Header).toBe(CometChatMessageInformationHeader);
      expect(CometChatMessageInformation.MessagePreview).toBe(
        CometChatMessageInformationMessagePreview
      );
      expect(CometChatMessageInformation.ReceiptList).toBe(CometChatMessageInformationReceiptList);
      expect(CometChatMessageInformation.LoadingState).toBe(
        CometChatMessageInformationLoadingState
      );
      expect(CometChatMessageInformation.ErrorState).toBe(CometChatMessageInformationErrorState);
      expect(CometChatMessageInformation.EmptyState).toBe(CometChatMessageInformationEmptyState);
    });

    it('has the expected displayName', () => {
      expect(CometChatMessageInformation.displayName).toBe('CometChatMessageInformation');
    });
  });

  describe('delegates to Root', () => {
    it('renders Root and forwards root props, with no children', () => {
      const onClose = vi.fn();
      render(<CometChatMessageInformation message={message} onClose={onClose} showScrollbar />);
      expect(screen.getByTestId('root')).toBeInTheDocument();
      const call = vi.mocked(CometChatMessageInformationRoot).mock.calls[0]?.[0];
      expect(call?.message).toBe(message);
      expect(call?.onClose).toBe(onClose);
      expect(call?.showScrollbar).toBe(true);
      expect(call?.children).toBeUndefined();
    });

    it('hands the view props to Root through context, not as props or children', () => {
      render(
        <CometChatMessageInformation
          message={message}
          headerView={<span>h</span>}
          receiptListView={<span>rl</span>}
          loadingView={<span>l</span>}
          errorView={<span>e</span>}
          emptyView={<span>n</span>}
        />
      );
      for (const text of ['h', 'rl', 'l', 'e', 'n']) {
        expect(screen.getByText(text)).toBeInTheDocument();
      }
      const call = vi.mocked(CometChatMessageInformationRoot).mock.calls[0]?.[0];
      expect(call?.children).toBeUndefined();
      expect(call).not.toHaveProperty('headerView');
    });
  });
});
