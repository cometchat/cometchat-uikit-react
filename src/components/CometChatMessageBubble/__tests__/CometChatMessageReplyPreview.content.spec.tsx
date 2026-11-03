// Quoted-message preview: title, subtitle per message kind, deleted state, interaction and width sync.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageReplyPreview } from '../CometChatMessageReplyPreview';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { LocaleContext } from '../../../context/locale/LocaleContext';
import type { TranslationContextValue } from '../../../resources/CometChatLocalize/localize.types';
import enUs from '../../../resources/CometChatLocalize/resources/en-us/translation.json';

interface QuotedOptions {
  type?: string;
  category?: string;
  text?: string;
  senderUid?: string;
  senderName?: string;
  deletedAt?: number;
  metadata?: Record<string, unknown>;
  mentions?: { uid: string; name: string }[];
  attachmentCount?: number;
  caption?: string;
  customData?: Record<string, unknown>;
  conversationText?: string;
  omit?: ('getText' | 'getAttachments' | 'getCaption' | 'getCustomData')[];
}

function quoted(opts: QuotedOptions = {}): CometChat.BaseMessage {
  const message: Record<string, unknown> = {
    getId: () => 1,
    getType: () => opts.type ?? 'text',
    getCategory: () => opts.category ?? 'message',
    getText: () => opts.text ?? '',
    getDeletedAt: () => opts.deletedAt ?? 0,
    getSender: () => ({
      getUid: () => opts.senderUid ?? 'bob',
      getName: () => opts.senderName ?? 'Bob',
    }),
    getMentionedUsers: () =>
      (opts.mentions ?? []).map(m => ({
        getUid: () => m.uid,
        getName: () => m.name,
      })),
    getMetadata: () => opts.metadata ?? {},
    getAttachments: () =>
      Array.from({ length: opts.attachmentCount ?? 1 }, (_, i) => ({
        url: `u${String(i)}`,
      })),
    getCaption: () => opts.caption ?? '',
    getCustomData: () => opts.customData ?? {},
    getConversationText: () => opts.conversationText ?? '',
  };
  for (const key of opts.omit ?? []) {
    message[key] = undefined;
  }
  return message as unknown as CometChat.BaseMessage;
}

function subtitleText(preview: HTMLElement): HTMLElement {
  const el = preview.querySelector<HTMLElement>('.cometchat-message-reply-preview__subtitle-text');
  if (!el) throw new Error('subtitle text element not rendered');
  return el;
}

function subtitleIcon(preview: HTMLElement): Element | null {
  return preview.querySelector('.cometchat-message-reply-preview__subtitle-icon');
}

function renderPreview(message: CometChat.BaseMessage, onClick?: () => void) {
  render(
    <CometChatMessageReplyPreview quotedMessage={message} alignment="left" onClick={onClick} />
  );
  return screen.getByRole('button');
}

beforeEach(() => {
  vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('CometChatMessageReplyPreview — title and accessible name', () => {
  it('shows the sender name and names the button after them', () => {
    const preview = renderPreview(quoted({ text: 'hello', senderName: 'Bob' }));
    expect(preview).toHaveAccessibleName('Quoted message from Bob');
    expect(within(preview).getByText('Bob')).toBeInTheDocument();
    expect(subtitleText(preview)).toHaveTextContent('hello');
  });

  it('shows "You" when the quoted message was sent by the logged-in user', () => {
    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue({
      getUid: () => 'me',
    } as unknown as CometChat.User);
    const preview = renderPreview(quoted({ text: 'mine', senderUid: 'me', senderName: 'Me' }));
    expect(preview).toHaveAccessibleName('Quoted message from You');
    expect(within(preview).getByText('You')).toBeInTheDocument();
    expect(within(preview).queryByText('Me')).toBeNull();
  });

  it('applies the caller className', () => {
    render(
      <CometChatMessageReplyPreview
        quotedMessage={quoted({ text: 'x' })}
        alignment="right"
        className="my-preview"
      />
    );
    expect(screen.getByRole('button')).toHaveClass('my-preview');
  });
});

describe('CometChatMessageReplyPreview — interaction', () => {
  it('calls onClick on click, Enter and Space, but not on other keys', () => {
    const onClick = vi.fn();
    const preview = renderPreview(quoted({ text: 'hi' }), onClick);

    fireEvent.click(preview);
    fireEvent.keyDown(preview, { key: 'Enter' });
    fireEvent.keyDown(preview, { key: ' ' });
    fireEvent.keyDown(preview, { key: 'a' });

    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('is keyboard-focusable and does not throw without an onClick', () => {
    const preview = renderPreview(quoted({ text: 'hi' }));
    expect(preview).toHaveAttribute('tabindex', '0');
    expect(() => {
      fireEvent.click(preview);
      fireEvent.keyDown(preview, { key: 'Enter' });
    }).not.toThrow();
  });
});

describe('CometChatMessageReplyPreview — deleted quoted message', () => {
  it('shows the deleted notice with its own accessible name and stays clickable', () => {
    const onClick = vi.fn();
    const preview = renderPreview(quoted({ text: 'gone', deletedAt: 123 }), onClick);

    expect(preview).toHaveAccessibleName('Quoted message (deleted)');
    expect(within(preview).getByText('This message was deleted')).toBeInTheDocument();
    expect(within(preview).getByText('Bob')).toBeInTheDocument();
    expect(within(preview).queryByText('gone')).toBeNull();

    fireEvent.click(preview);
    fireEvent.keyDown(preview, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});

describe('CometChatMessageReplyPreview — text messages', () => {
  it('renders rich-text HTML from metadata when it carries formatting, without scripts', () => {
    const preview = renderPreview(
      quoted({
        text: 'plain fallback',
        metadata: {
          richText: {
            html: '<b>Bold</b> move<script>window.x=1</script>',
            hasFormatting: true,
          },
        },
      })
    );
    const text = subtitleText(preview);
    expect(within(text).getByText('Bold').tagName).toBe('B');
    expect(text).not.toHaveTextContent('plain fallback');
    expect(text.querySelector('script')).toBeNull();
  });

  it('ignores rich-text HTML that is not flagged as formatted', () => {
    const preview = renderPreview(
      quoted({
        text: 'raw text',
        metadata: { richText: { html: '<b>rich</b>', hasFormatting: false } },
      })
    );
    expect(subtitleText(preview)).toHaveTextContent('raw text');
    expect(subtitleText(preview)).not.toHaveTextContent('rich');
  });

  it('falls back to the raw text when the metadata cannot be read', () => {
    const message = quoted({ text: 'still shown' });
    (message as unknown as { getMetadata: () => never }).getMetadata = () => {
      throw new Error('boom');
    };
    expect(subtitleText(renderPreview(message))).toHaveTextContent('still shown');
  });

  it('strips markdown markers from the quoted text', () => {
    const preview = renderPreview(quoted({ text: '**bold** and _it_' }));
    expect(subtitleText(preview)).toHaveTextContent('bold and it');
    expect(subtitleText(preview).textContent).not.toContain('**');
  });

  it('shows user-typed HTML as inert text instead of markup', () => {
    const preview = renderPreview(quoted({ text: '<img src=x onerror="alert(1)"> hi' }));
    const text = subtitleText(preview);
    expect(text.querySelector('img')).toBeNull();
    expect(text).toHaveTextContent('<img src=x onerror="alert(1)"> hi');
  });

  it('resolves known mentions to names, leaves unknown uids readable and labels @all', () => {
    const preview = renderPreview(
      quoted({
        text: 'hi <@uid:u1> and <@uid:ghost> cc <@all:everyone>',
        mentions: [{ uid: 'u1', name: 'Alice' }],
      })
    );
    const text = subtitleText(preview);
    expect(text).toHaveTextContent('hi @Alice and @ghost cc @everyone');
    expect(within(text).getByText('@Alice').tagName).toBe('SPAN');
    expect(within(text).getByText('@everyone').tagName).toBe('SPAN');
  });

  it('turns URLs in the quoted text into links', () => {
    const preview = renderPreview(quoted({ text: 'see https://example.com/page' }));
    const link = within(subtitleText(preview)).getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/page');
  });

  it('shows the deleted notice for a text message with no text', () => {
    const preview = renderPreview(quoted({ text: '' }));
    expect(subtitleText(preview)).toHaveTextContent('This message was deleted');
    expect(subtitleIcon(preview)).toBeNull();
  });

  it('treats a message without a text accessor as empty', () => {
    const preview = renderPreview(quoted({ omit: ['getText'] }));
    expect(subtitleText(preview)).toHaveTextContent('This message was deleted');
  });
});

describe('CometChatMessageReplyPreview — media messages', () => {
  it.each([
    ['image', 'Image'],
    ['video', 'Video'],
    ['audio', 'Audio'],
    ['file', 'File'],
  ])('labels a single %s attachment and shows its icon', (type, label) => {
    const preview = renderPreview(quoted({ type }));
    expect(subtitleText(preview)).toHaveTextContent(new RegExp(`^${label}$`));
    expect(subtitleIcon(preview)).toHaveClass(
      `cometchat-message-reply-preview__subtitle-icon-${type}`
    );
  });

  it.each([
    ['image', 3, '3 Images'],
    ['video', 2, '2 Videos'],
    ['audio', 4, '4 Audio Files'],
    ['file', 5, '5 Files'],
  ])('counts multiple %s attachments', (type, count, label) => {
    const preview = renderPreview(quoted({ type, attachmentCount: count }));
    expect(subtitleText(preview)).toHaveTextContent(label);
  });

  it('falls back to the singular label when no plural translation exists', () => {
    const locale: TranslationContextValue = {
      getLocalizedString: (key: string) =>
        key.endsWith('_plural') ? key : ((enUs as Record<string, string>)[key] ?? key),
      tDateTimeParser: input => (input ? new Date(input) : new Date()),
      language: 'en-us',
      dateLocaleLanguage: 'en-us',
    };
    render(
      <LocaleContext.Provider value={locale}>
        <CometChatMessageReplyPreview
          quotedMessage={quoted({ type: 'image', attachmentCount: 2 })}
          alignment="left"
        />
      </LocaleContext.Provider>
    );
    expect(subtitleText(screen.getByRole('button'))).toHaveTextContent(/^2 Image$/);
  });

  it('treats a media message without attachments as a single item', () => {
    const preview = renderPreview(
      quoted({ type: 'image', omit: ['getAttachments', 'getCaption'] })
    );
    expect(subtitleText(preview)).toHaveTextContent(/^Image$/);
  });

  it('appends a trimmed, formatted caption after the label', () => {
    const preview = renderPreview(
      quoted({
        type: 'image',
        caption: '  look at <@uid:u1>  ',
        mentions: [{ uid: 'u1', name: 'Alice' }],
      })
    );
    expect(subtitleText(preview)).toHaveTextContent(/^Image · look at @Alice$/);
  });

  it('ignores a whitespace-only caption', () => {
    const preview = renderPreview(quoted({ type: 'video', caption: '   ' }));
    expect(subtitleText(preview)).toHaveTextContent(/^Video$/);
  });
});

describe('CometChatMessageReplyPreview — custom and unsupported messages', () => {
  it('shows a poll question from its custom data', () => {
    const preview = renderPreview(
      quoted({
        type: 'extension_poll',
        category: 'custom',
        customData: { question: 'Lunch?' },
        conversationText: 'ignored',
      })
    );
    expect(subtitleText(preview)).toHaveTextContent(/^Lunch\?$/);
    expect(subtitleIcon(preview)).toHaveClass(
      'cometchat-message-reply-preview__subtitle-icon-poll'
    );
  });

  it('falls back from poll question to conversation text, then text, then "Poll"', () => {
    const fromConversation = renderPreview(
      quoted({
        type: 'extension_poll',
        category: 'custom',
        conversationText: 'Poll: Lunch',
      })
    );
    expect(subtitleText(fromConversation)).toHaveTextContent('Poll: Lunch');
    document.body.innerHTML = '';

    const fromText = renderPreview(
      quoted({ type: 'extension_poll', category: 'custom', text: 'poll text' })
    );
    expect(subtitleText(fromText)).toHaveTextContent('poll text');
    document.body.innerHTML = '';

    const fallback = renderPreview(
      quoted({
        type: 'extension_poll',
        category: 'custom',
        omit: ['getCustomData'],
      })
    );
    expect(subtitleText(fallback)).toHaveTextContent(/^Poll$/);
  });

  it('labels a sticker', () => {
    const preview = renderPreview(quoted({ type: 'extension_sticker', category: 'custom' }));
    expect(subtitleText(preview)).toHaveTextContent(/^Sticker$/);
    expect(subtitleIcon(preview)).toHaveClass(
      'cometchat-message-reply-preview__subtitle-icon-sticker'
    );
  });

  it.each([
    ['extension_whiteboard', 'collaborative-whiteboard'],
    ['extension_document', 'collaborative-document'],
  ])('shows the conversation text and icon for %s', (type, icon) => {
    const preview = renderPreview(
      quoted({ type, category: 'custom', conversationText: 'Shared board' })
    );
    expect(subtitleText(preview)).toHaveTextContent(/^Shared board$/);
    expect(subtitleIcon(preview)).toHaveClass(
      `cometchat-message-reply-preview__subtitle-icon-${icon}`
    );
  });

  it('shows an unknown custom message by its conversation text, else its type', () => {
    const withText = renderPreview(
      quoted({
        type: 'location',
        category: 'custom',
        conversationText: 'Shared a location',
      })
    );
    expect(subtitleText(withText)).toHaveTextContent('Shared a location');
    expect(subtitleIcon(withText)).toHaveClass(
      'cometchat-message-reply-preview__subtitle-icon-unsupported'
    );
    document.body.innerHTML = '';

    const bare = renderPreview(quoted({ type: 'location', category: 'custom' }));
    expect(subtitleText(bare)).toHaveTextContent(/^location$/);
  });

  it('marks an unknown message type as unsupported', () => {
    const preview = renderPreview(quoted({ type: 'location', category: 'message' }));
    expect(subtitleText(preview)).toHaveTextContent(/^Unsupported$/);
  });

  it.each([
    ['extension_poll', 'Poll'],
    ['extension_sticker', 'Sticker'],
    ['extension_whiteboard', 'Collaborative Whiteboard'],
    ['extension_document', 'Collaborative Document'],
  ])('falls back to an English label for %s when the locale has no text', (type, label) => {
    const locale: TranslationContextValue = {
      getLocalizedString: () => '',
      tDateTimeParser: input => (input ? new Date(input) : new Date()),
      language: 'xx',
      dateLocaleLanguage: 'xx',
    };
    render(
      <LocaleContext.Provider value={locale}>
        <CometChatMessageReplyPreview
          quotedMessage={quoted({ type, category: 'custom' })}
          alignment="left"
        />
      </LocaleContext.Provider>
    );
    expect(subtitleText(screen.getByRole('button'))).toHaveTextContent(new RegExp(`^${label}$`));
  });

  it('marks quoted messages of other categories as unsupported', () => {
    const preview = renderPreview(quoted({ type: 'audio', category: 'call' }));
    expect(subtitleText(preview)).toHaveTextContent(/^Unsupported$/);
    expect(subtitleIcon(preview)).toHaveClass(
      'cometchat-message-reply-preview__subtitle-icon-unsupported'
    );
  });
});

describe('CometChatMessageReplyPreview — width follows the bubble content', () => {
  type ObserverCallback = (entries: { contentRect: { width: number } }[]) => void;

  function stubResizeObserver() {
    const instances: {
      callback: ObserverCallback;
      disconnect: ReturnType<typeof vi.fn>;
    }[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        disconnect = vi.fn();
        observe = vi.fn();
        constructor(callback: ObserverCallback) {
          instances.push({ callback, disconnect: this.disconnect });
        }
      }
    );
    return instances;
  }

  function renderInBubble(message: CometChat.BaseMessage) {
    return render(
      <div>
        <div>
          <CometChatMessageReplyPreview quotedMessage={message} alignment="left" />
        </div>
        <div className="cometchat-message-bubble__body-content-view" />
      </div>
    );
  }

  it('caps its width at the content width and enforces a minimum for narrow content', () => {
    const observers = stubResizeObserver();
    const { unmount } = renderInBubble(quoted({ text: 'hi' }));
    const preview = screen.getByRole('button');
    const observer = observers[0];
    if (!observer) throw new Error('ResizeObserver was not created');

    expect(preview.style.maxWidth).toBe('');

    act(() => {
      observer.callback([{ contentRect: { width: 240 } }]);
    });
    expect(preview.style.maxWidth).toBe('240px');
    expect(preview.style.width).toBe('100%');

    act(() => {
      observer.callback([{ contentRect: { width: 60 } }]);
    });
    expect(preview.style.maxWidth).toBe('105px');

    unmount();
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('applies the width constraint to the deleted state too', () => {
    const observers = stubResizeObserver();
    renderInBubble(quoted({ deletedAt: 5 }));
    const observer = observers[0];
    if (!observer) throw new Error('ResizeObserver was not created');

    act(() => {
      observer.callback([{ contentRect: { width: 180 } }]);
    });
    expect(screen.getByRole('button').style.maxWidth).toBe('180px');
  });

  it('does not observe anything outside a bubble body', () => {
    const observers = stubResizeObserver();
    renderPreview(quoted({ text: 'hi' }));
    expect(observers).toHaveLength(0);
  });
});
