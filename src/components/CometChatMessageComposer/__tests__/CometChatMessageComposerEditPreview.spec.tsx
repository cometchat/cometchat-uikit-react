/**
 * Unit tests for CometChatMessageComposerEditPreview: when it shows, the text
 * subtitle (rich-text HTML, markdown stripped, mentions, links, sanitising) and
 * the media summary (icon, singular / plural label, caption).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ ctx: {} as Record<string, unknown> }));

vi.mock('../CometChatMessageComposer.context', () => ({
  useCometChatMessageComposerContext: () => mocks.ctx,
}));

import { CometChatMessageComposerEditPreview } from '../CometChatMessageComposerEditPreview';
import { LocaleProvider } from '../../../context/locale/LocaleProvider';

interface FakeOptions {
  type?: string;
  text?: string;
  caption?: string;
  attachments?: number;
  metadata?: Record<string, unknown>;
  mentioned?: { uid: string; name: string }[];
}

function message({ type = 'text', text = '', caption = '', attachments = 1, metadata, mentioned = [] }: FakeOptions) {
  return {
    getType: () => type,
    getText: () => text,
    getCaption: () => caption,
    getAttachments: () => Array.from({ length: attachments }, () => ({})),
    getMetadata: () => metadata,
    getMentionedUsers: () => mentioned.map(u => ({ getUid: () => u.uid, getName: () => u.name })),
  };
}

function renderPreview(msg: unknown, overrides: Record<string, unknown> = {}) {
  mocks.ctx = {
    isInEditMode: true,
    textMessageToEdit: msg,
    closePreview: vi.fn(),
    textFormatters: undefined,
    ...overrides,
  };
  return render(
    <LocaleProvider>
      <CometChatMessageComposerEditPreview className="mine" />
    </LocaleProvider>
  );
}

const subtitle = () => document.querySelector('.cometchat-message-composer__edit-preview-subtitle')!;

describe('CometChatMessageComposerEditPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing outside edit mode or without a message', () => {
    expect(renderPreview(message({ text: 'x' }), { isInEditMode: false }).container).toBeEmptyDOMElement();
    expect(renderPreview(null).container.querySelector('.cometchat-message-composer__edit-preview')).toBeNull();
  });

  it('announces itself, shows the "Edit message" title and closes from its button', () => {
    renderPreview(message({ text: 'hello' }));
    const root = screen.getByRole('status');
    expect(root).toHaveClass('cometchat-message-composer__edit-preview', 'mine');
    expect(root).toHaveAttribute('aria-live', 'polite');
    expect(root).toHaveTextContent('Edit message');
    fireEvent.click(document.querySelector('.cometchat-message-composer__edit-preview-close')!);
    expect(mocks.ctx.closePreview).toHaveBeenCalled();
  });

  describe('text messages', () => {
    it('strips markdown from the text', () => {
      renderPreview(message({ text: '**bold** and _soft_' }));
      expect(subtitle().textContent).toBe('bold and soft');
    });

    it('prefers the sanitised rich-text HTML when the message has formatting', () => {
      renderPreview(
        message({
          text: 'plain',
          metadata: { richText: { html: '<b>rich</b><img src="x" onerror="alert(1)">', hasFormatting: true } },
        })
      );
      expect(subtitle().querySelector('b')?.textContent).toBe('rich');
      expect(subtitle().querySelector('[onerror]')).toBeNull();
    });

    it('ignores rich-text HTML that is not marked as formatted', () => {
      renderPreview(message({ text: 'plain', metadata: { richText: { html: '<b>rich</b>', hasFormatting: false } } }));
      expect(subtitle().textContent).toBe('plain');
    });

    it('resolves user mentions to names, drops unknown ones, and highlights @all', () => {
      renderPreview(
        message({
          text: 'hi <@uid:ann> and <@uid:ghost>, ping <@all:everyone>',
          mentioned: [{ uid: 'ann', name: 'Ann' }],
        })
      );
      expect(subtitle().textContent).toBe('hi @Ann and , ping @everyone');
      expect(subtitle().querySelector('.cometchat-mentions-you')?.textContent).toBe('@everyone');
    });

    it('turns URLs into links', () => {
      renderPreview(message({ text: 'see https://cometchat.com' }));
      expect(subtitle().querySelector('a')?.getAttribute('href')).toContain('https://cometchat.com');
    });

    it('sanitises script in the text', () => {
      renderPreview(message({ text: 'x <img src=y onerror="alert(1)">' }));
      expect(subtitle().querySelector('[onerror]')).toBeNull();
    });
  });

  describe('media messages', () => {
    const mediaLabel = () => document.querySelector('.cometchat-message-composer__edit-preview-media-label')?.textContent;
    const caption = () => document.querySelector('.cometchat-message-composer__edit-preview-caption');

    it('shows the singular type label for one attachment, without a caption row when empty', () => {
      renderPreview(message({ type: 'image' }));
      expect(mediaLabel()).toBe('Image');
      expect(document.querySelector('.cometchat-message-composer__edit-preview-media-icon')).not.toBeNull();
      expect(caption()).toBeNull();
    });

    it.each([
      ['image', '4 Images'],
      ['video', '4 Videos'],
      ['audio', '4 Audio Files'],
      ['file', '4 Files'],
    ])('counts several %s attachments', (type, label) => {
      renderPreview(message({ type, attachments: 4 }));
      expect(mediaLabel()).toBe(label);
    });

    it('falls back to the singular label for types without a plural string', () => {
      renderPreview(message({ type: 'whiteboard', attachments: 2 }));
      expect(mediaLabel()).toMatch(/^2 /);
      expect(mediaLabel()).not.toContain('media_edit_preview');
    });

    it('shows the formatted caption next to the summary', () => {
      renderPreview(message({ type: 'image', caption: '**trip** photos' }));
      expect(document.querySelector('.cometchat-message-composer__edit-preview-separator')?.textContent).toBe('·');
      expect(caption()?.textContent).toBe('trip photos');
    });
  });
});
