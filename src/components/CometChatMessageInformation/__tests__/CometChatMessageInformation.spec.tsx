import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ─── Mock Root + sub-components ──────────────────────────────────────────────
vi.mock('../CometChatMessageInformationRoot', () => ({
  CometChatMessageInformationRoot: vi.fn(({ children }: { children?: React.ReactNode }) => (
    <div data-testid="root">{children}</div>
  )),
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

  describe('no convenience props → delegates to Root with no children', () => {
    it('renders Root and forwards root props', () => {
      const onClose = vi.fn();
      render(<CometChatMessageInformation message={message} onClose={onClose} showScrollbar />);
      expect(screen.getByTestId('root')).toBeInTheDocument();
      expect(screen.queryByTestId('header')).not.toBeInTheDocument();
      const call = vi.mocked(CometChatMessageInformationRoot).mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(call.message).toBe(message);
      expect(call.onClose).toBe(onClose);
      expect(call.showScrollbar).toBe(true);
      expect(call.children).toBeUndefined();
    });
  });

  describe('convenience props → composes default layout', () => {
    it('renders default header/preview/receipt-list when only headerView is set', () => {
      render(<CometChatMessageInformation message={message} headerView={<span>h</span>} />);
      expect(screen.getByText('h')).toBeInTheDocument();
      expect(screen.queryByTestId('header')).not.toBeInTheDocument();
      expect(screen.getByTestId('preview')).toBeInTheDocument();
      expect(screen.getByTestId('receipt-list')).toBeInTheDocument();
    });

    it('renders default header when a non-header convenience prop forces layout', () => {
      render(<CometChatMessageInformation message={message} loadingView={<span>l</span>} />);
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('preview')).toBeInTheDocument();
      expect(screen.getByTestId('receipt-list')).toBeInTheDocument();
    });

    it('uses custom receiptListView when provided', () => {
      render(<CometChatMessageInformation message={message} receiptListView={<span>rl</span>} />);
      expect(screen.getByText('rl')).toBeInTheDocument();
      expect(screen.queryByTestId('receipt-list')).not.toBeInTheDocument();
    });

    it('renders LoadingState when loadingView is provided', () => {
      render(<CometChatMessageInformation message={message} loadingView={<span>l</span>} />);
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('renders ErrorState when errorView is provided', () => {
      render(<CometChatMessageInformation message={message} errorView={<span>e</span>} />);
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    it('renders EmptyState when emptyView is provided', () => {
      render(<CometChatMessageInformation message={message} emptyView={<span>e</span>} />);
      expect(screen.getByTestId('empty')).toBeInTheDocument();
    });

    it('does not render optional states when their views are not provided', () => {
      render(<CometChatMessageInformation message={message} headerView={<span>h</span>} />);
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error')).not.toBeInTheDocument();
      expect(screen.queryByTestId('empty')).not.toBeInTheDocument();
    });
  });
});
