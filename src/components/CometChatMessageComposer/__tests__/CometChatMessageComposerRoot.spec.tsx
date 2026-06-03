/**
 * Unit tests for CometChatMessageComposerRoot component.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockCometChat } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));

vi.mock('../CometChatMessageComposerAttachmentButton', () => ({
  CometChatMessageComposerAttachmentButton: () => (
    <button type="button" aria-label="Attachments" data-testid="attachment-btn">
      Attach
    </button>
  ),
}));

vi.mock('../CometChatMessageComposerEmojiButton', () => ({
  CometChatMessageComposerEmojiButton: () => (
    <button type="button" aria-label="Emoji" data-testid="emoji-btn">
      Emoji
    </button>
  ),
}));

vi.mock('../CometChatMessageComposerStickerButton', () => ({
  CometChatMessageComposerStickerButton: () => (
    <button type="button" aria-label="Sticker" data-testid="sticker-btn">
      Sticker
    </button>
  ),
}));

vi.mock('../CometChatMessageComposerVoiceButton', () => ({
  CometChatMessageComposerVoiceButton: () => (
    <button type="button" aria-label="Voice Recording" data-testid="voice-btn">
      Voice
    </button>
  ),
}));

vi.mock('../CometChatMessageComposerEditPreview', () => ({
  CometChatMessageComposerEditPreview: () => null,
}));

vi.mock('../CometChatMessageComposerReplyPreview', () => ({
  CometChatMessageComposerReplyPreview: () => null,
}));

vi.mock('../CometChatMessageComposerMentionsList', () => ({
  CometChatMessageComposerMentionsList: () => null,
}));

vi.mock('../../base/CometChatFormattingToolbar/CometChatFormattingToolbar', () => ({
  CometChatFormattingToolbar: () => (
    <div data-testid="formatting-toolbar">
      <button type="button" aria-label="Bold">
        B
      </button>
      <button type="button" aria-label="Italic">
        I
      </button>
    </div>
  ),
}));

vi.mock('../../base/CometChatLinkDialog/CometChatLinkDialog', () => ({
  CometChatLinkDialog: () => null,
}));

vi.mock('../../base/CometChatLinkPopover/CometChatLinkPopover', () => ({
  CometChatLinkPopover: () => null,
}));

vi.mock('../../base/CometChatMediaRecorder/CometChatMediaRecorder', () => ({
  CometChatMediaRecorder: {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Controls: () => null,
    Timer: () => null,
    RecordingView: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PreviewView: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ErrorView: () => null,
  },
}));

vi.mock('../../base/CometChatMediaRecorder/CometChatMediaRecorder.context', () => ({
  useCometChatMediaRecorderContext: () => ({ inlineSend: vi.fn() }),
}));

vi.mock('../useCometChatMentions', () => ({
  useCometChatMentions: () => ({
    isOpen: false,
    suggestions: [],
    isLoading: false,
    focusedIndex: -1,
    handleMentionStart: vi.fn(),
    handleMentionEnd: vi.fn(),
    handleSelect: vi.fn(),
  }),
}));

vi.mock('../../../utils/RichTextEditor/useRichTextEditor', () => ({
  useRichTextEditor: () => ({
    editorRef: { current: null },
    formatState: {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      code: false,
      codeBlock: false,
      blockquote: false,
      orderedList: false,
      bulletList: false,
      link: false,
    },
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleUnderline: vi.fn(),
    toggleStrikethrough: vi.fn(),
    toggleInlineCode: vi.fn(),
    toggleCodeBlock: vi.fn(),
    toggleBlockquote: vi.fn(),
    toggleOrderedList: vi.fn(),
    toggleBulletList: vi.fn(),
    setLink: vi.fn(),
    insertMention: vi.fn(),
    insertPlainText: vi.fn(),
    clear: vi.fn(),
    focus: vi.fn(),
    saveSelection: vi.fn().mockReturnValue(null),
    restoreSelection: vi.fn(),
    getCurrentLink: vi.fn().mockReturnValue(null),
    getCurrentLinkText: vi.fn().mockReturnValue(null),
  }),
}));

import { LocaleProvider } from '../../../context/locale/LocaleProvider';
import { CometChatMessageComposerRoot } from '../CometChatMessageComposerRoot';
import { CometChatMessageComposer } from '../CometChatMessageComposer';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LocaleProvider>{children}</LocaleProvider>
);

describe('CometChatMessageComposerRoot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCometChat.isInitialized = vi.fn().mockReturnValue(false);
    mockCometChat.getLoggedinUser = vi.fn().mockResolvedValue(null);
  });

  describe('rendering', () => {
    it('renders the input element with role="textbox"', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders the send button', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('renders the attachment button', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      expect(screen.getByTestId('attachment-btn')).toBeInTheDocument();
    });

    it('renders the emoji button', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      expect(screen.getByTestId('emoji-btn')).toBeInTheDocument();
    });

    it('renders the voice button', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      expect(screen.getByTestId('voice-btn')).toBeInTheDocument();
    });

    it('renders the sticker button', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      expect(screen.getByTestId('sticker-btn')).toBeInTheDocument();
    });

    it('applies the compact layout class by default', () => {
      const { container } = render(<CometChatMessageComposerRoot />, { wrapper });
      const root = container.firstChild as HTMLElement;
      expect(root.className).toMatch(/compact/);
    });

    it('applies the multiline layout class when layout="multiline"', () => {
      const { container } = render(<CometChatMessageComposerRoot layout="multiline" />, {
        wrapper,
      });
      const root = container.firstChild as HTMLElement;
      expect(root.className).toMatch(/multiline/);
    });

    it('applies a custom className when provided', () => {
      const { container } = render(<CometChatMessageComposerRoot className="my-custom-class" />, {
        wrapper,
      });
      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain('my-custom-class');
    });
  });

  describe('send button state', () => {
    it('send button is disabled when input is empty', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('send button is enabled after typing text', async () => {
      const user = userEvent.setup();
      render(<CometChatMessageComposerRoot />, { wrapper });
      await user.type(screen.getByRole('textbox'), 'Hello');
      expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled();
    });
  });

  describe('input interaction', () => {
    it('calls onTextChange when text changes', async () => {
      const onTextChange = vi.fn();
      const user = userEvent.setup();
      render(<CometChatMessageComposerRoot onTextChange={onTextChange} />, { wrapper });
      await user.type(screen.getByRole('textbox'), 'A');
      expect(onTextChange).toHaveBeenCalled();
    });

    it('pressing Enter calls onSendButtonClick when provided', async () => {
      const onSendButtonClick = vi.fn();
      const user = userEvent.setup();
      render(
        <CometChatMessageComposerRoot
          enterKeyBehavior="send"
          onSendButtonClick={onSendButtonClick}
        />,
        { wrapper }
      );
      await user.type(screen.getByRole('textbox'), 'Hello');
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(onSendButtonClick).toHaveBeenCalledOnce();
      });
    });

    it('Shift+Enter does not send', async () => {
      const onSendButtonClick = vi.fn();
      const user = userEvent.setup();
      render(
        <CometChatMessageComposerRoot
          enterKeyBehavior="send"
          onSendButtonClick={onSendButtonClick}
        />,
        { wrapper }
      );
      await user.type(screen.getByRole('textbox'), 'Hello');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      expect(onSendButtonClick).not.toHaveBeenCalled();
    });
  });

  describe('rich text editor', () => {
    it('renders the formatting toolbar when enableRichTextEditor=true', () => {
      render(<CometChatMessageComposerRoot enableRichTextEditor />, { wrapper });
      expect(screen.getByTestId('formatting-toolbar')).toBeInTheDocument();
    });

    it('does NOT render the formatting toolbar by default', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      expect(screen.queryByTestId('formatting-toolbar')).not.toBeInTheDocument();
    });

    it('does NOT render the formatting toolbar when hideRichTextFormattingOptions=true', () => {
      render(<CometChatMessageComposerRoot enableRichTextEditor hideRichTextFormattingOptions />, {
        wrapper,
      });
      expect(screen.queryByTestId('formatting-toolbar')).not.toBeInTheDocument();
    });
  });

  describe('custom children', () => {
    it('renders custom children inside the body flex container', () => {
      render(
        <CometChatMessageComposerRoot>
          <div data-testid="custom-child">Custom content</div>
        </CometChatMessageComposerRoot>,
        { wrapper }
      );
      expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    });

    it('does NOT render default buttons when custom children are provided', () => {
      render(
        <CometChatMessageComposerRoot>
          <div data-testid="custom-child">Custom</div>
        </CometChatMessageComposerRoot>,
        { wrapper }
      );
      expect(screen.queryByTestId('attachment-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('emoji-btn')).not.toBeInTheDocument();
    });
  });

  describe('compound component usage', () => {
    it('renders Input and SendButton sub-components correctly', () => {
      render(
        <LocaleProvider>
          <CometChatMessageComposer.Root>
            <CometChatMessageComposer.Input />
            <CometChatMessageComposer.SendButton />
          </CometChatMessageComposer.Root>
        </LocaleProvider>
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('send button in compound usage is disabled when input is empty', () => {
      render(
        <LocaleProvider>
          <CometChatMessageComposer.Root>
            <CometChatMessageComposer.Input />
            <CometChatMessageComposer.SendButton />
          </CometChatMessageComposer.Root>
        </LocaleProvider>
      );
      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });
  });

  describe('placeholder', () => {
    it('renders the placeholder text', () => {
      render(<CometChatMessageComposerRoot placeholder="Write something..." />, { wrapper });
      expect(screen.getByText('Write something...')).toBeInTheDocument();
    });

    it('uses default placeholder when not provided', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      expect(screen.getByText('Enter your message here')).toBeInTheDocument();
    });
  });

  describe('send button click', () => {
    it('clicking send button calls onSendButtonClick in standalone mode', async () => {
      const onSendButtonClick = vi.fn();
      const user = userEvent.setup();
      render(<CometChatMessageComposerRoot onSendButtonClick={onSendButtonClick} />, { wrapper });
      await user.type(screen.getByRole('textbox'), 'Hello');
      await user.click(screen.getByRole('button', { name: /send/i }));
      await waitFor(() => {
        expect(onSendButtonClick).toHaveBeenCalledOnce();
      });
    });

    it('clicking send button clears the input in standalone mode', async () => {
      const user = userEvent.setup();
      render(<CometChatMessageComposerRoot />, { wrapper });
      await user.type(screen.getByRole('textbox'), 'Hello');
      await user.click(screen.getByRole('button', { name: /send/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
      });
    });
  });

  describe('accessibility', () => {
    it('input has role="textbox"', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('input has aria-label', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label');
    });

    it('send button has aria-label', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      expect(screen.getByRole('button', { name: /send/i })).toHaveAttribute('aria-label');
    });

    it('input has aria-multiline="true"', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-multiline', 'true');
    });
  });
});
