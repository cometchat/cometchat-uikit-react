/**
 * The public props of <CometChatImagesBubble />, one case each: the prop is set (or left out) on the real
 * component and the test checks what it changes. Only the SDK is mocked (the logged-in user the bubble
 * looks up); jsdom never loads images, so each test decides when its photos have loaded.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatImagesBubble } from '../CometChatImagesBubble';
import { CometChatUrlFormatter } from '../../../formatters/CometChatUrlFormatter';
import { buildMediaMessage, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

/** Every `new Image()` the bubble makes to preload a photo; none loads until `loadPhotos()`. */
const preloads: { onload: (() => void) | null }[] = [];
class PreloadedImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
  constructor() {
    preloads.push(this);
  }
}
const loadPhotos = () => {
  act(() => {
    for (const image of preloads.splice(0)) image.onload?.();
  });
};

const tenDaysAgo = Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60;
const alice = buildUser({ uid: 'alice', name: 'Alice', avatar: '' });
const bob = buildUser({ uid: 'bob', name: 'Bob', avatar: '' });
const beach = 'https://example.com/beach.jpg';
const dunes = 'https://example.com/dunes.jpg';
const pier = 'https://example.com/pier.jpg';

/** An image message from Alice (or `sender`) carrying `urls`, with an optional caption. */
function photos(options: { urls?: string[]; caption?: string; sender?: ReturnType<typeof buildUser> } = {}) {
  const urls = options.urls ?? [beach];
  return {
    ...buildMediaMessage({ id: 5, type: 'image', sender: options.sender ?? alice, sentAt: tenDaysAgo }),
    getAttachments: () =>
      urls.map((url, i) => ({ getUrl: () => url, getSize: () => 1000 + i, getName: () => `photo-${String(i)}.jpg` })),
    getCaption: () => options.caption ?? '',
    getData: () => ({}),
    getMentionedUsers: () => [],
  } as unknown as CometChat.MediaMessage;
}

const root = (container: HTMLElement) => container.firstElementChild as HTMLElement;
const caption = (container: HTMLElement) => container.querySelector('.cometchat-images-bubble__caption');
const spyOnLoggedInUser = () => vi.spyOn(CometChat, 'getLoggedinUser');
let loggedInUser: ReturnType<typeof spyOnLoggedInUser>;
const theLoggedInUser = (user: ReturnType<typeof buildUser> | null) => {
  loggedInUser.mockResolvedValue(user as unknown as CometChat.User);
};

beforeEach(() => {
  preloads.length = 0;
  vi.stubGlobal('Image', PreloadedImage);
  loggedInUser = spyOnLoggedInUser();
  theLoggedInUser(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CometChatImagesBubble props', () => {
  describe('alignment', () => {
    it('right draws an outgoing bubble, caption included', () => {
      covers('CometChatImagesBubble.alignment', 'right');
      const { container } = render(<CometChatImagesBubble message={photos({ caption: 'Beach day', sender: bob })} alignment="right" />);
      expect(root(container)).toHaveClass('cometchat-images-bubble--outgoing');
      expect(root(container)).not.toHaveClass('cometchat-images-bubble--incoming');
      expect(caption(container)?.firstElementChild).toHaveClass('cometchat-text-bubble--outgoing');
    });

    it('left draws an incoming bubble, even for photos the logged-in user sent', async () => {
      covers('CometChatImagesBubble.alignment', 'left');
      theLoggedInUser(alice);
      const forced = render(<CometChatImagesBubble message={photos({ caption: 'Beach day' })} alignment="left" />);
      const derived = render(<CometChatImagesBubble message={photos({ caption: 'Beach day' })} />);
      // Once the logged-in user is known, the same photos without the prop turn outgoing.
      await waitFor(() => {
        expect(root(derived.container)).toHaveClass('cometchat-images-bubble--outgoing');
      });
      expect(root(forced.container)).toHaveClass('cometchat-images-bubble--incoming');
      expect(caption(forced.container)?.firstElementChild).toHaveClass('cometchat-text-bubble--incoming');
    });

    it("by default photos the logged-in user sent are outgoing, anyone else's incoming", async () => {
      covers('CometChatImagesBubble.alignment', 'default');
      theLoggedInUser(alice);
      const mine = render(<CometChatImagesBubble message={photos({ sender: alice })} />);
      const theirs = render(<CometChatImagesBubble message={photos({ sender: bob })} />);
      await waitFor(() => {
        expect(root(mine.container)).toHaveClass('cometchat-images-bubble--outgoing');
      });
      expect(loggedInUser).toHaveBeenCalledTimes(2);
      expect(root(theirs.container)).toHaveClass('cometchat-images-bubble--incoming');
    });
  });

  it('className is added to the bubble; by default it has only its own', () => {
    covers('CometChatImagesBubble.className', 'set', 'default');
    const view = render(<CometChatImagesBubble message={photos()} alignment="left" className="app-photos" />);
    expect(root(view.container)).toHaveClass('app-photos', 'cometchat-images-bubble');
    view.unmount();

    const { container } = render(<CometChatImagesBubble message={photos()} alignment="left" />);
    expect([...root(container).classList]).toEqual([
      'cometchat-images-bubble',
      'cometchat-images-bubble--incoming',
      'cometchat-images-bubble--single',
    ]);
  });

  it('message is what is drawn: every photo it carries, its sender and its caption', () => {
    covers('CometChatImagesBubble.message', 'set');
    const { container } = render(
      <CometChatImagesBubble message={photos({ urls: [beach, dunes, pier], caption: 'Beach day' })} alignment="left" />
    );
    loadPhotos();
    expect(root(container)).toHaveClass('cometchat-images-bubble--grid');
    expect(container.querySelector('.cometchat-images-bubble__grid')).toHaveClass('cometchat-images-bubble__grid--three');
    const images = screen.getAllByRole('img', { name: 'Photo from Alice' });
    expect(images.map(image => image.getAttribute('src'))).toEqual([beach, dunes, pier]);
    expect(screen.getAllByRole('button', { name: 'Image: Beach day. Press Enter to view fullscreen.' })).toHaveLength(3);
    expect(caption(container)).toHaveTextContent('Beach day');
  });

  it('onImageClicked gets the photo clicked and its index, and the photos still open full screen', async () => {
    covers('CometChatImagesBubble.onImageClicked', 'called');
    const onImageClicked = vi.fn();
    render(<CometChatImagesBubble message={photos({ urls: [beach, dunes] })} alignment="left" onImageClicked={onImageClicked} />);
    loadPhotos();
    const tiles = screen.getAllByRole('button', { name: 'Image message. Press Enter to view fullscreen.' });
    fireEvent.click(tiles[1]!);
    expect(onImageClicked).toHaveBeenCalledTimes(1);
    expect(onImageClicked).toHaveBeenCalledWith({ url: dunes, size: 1001, name: 'photo-1.jpg' }, 1);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('placeholderImage is shown while the photos load, then the photos replace it', () => {
    covers('CometChatImagesBubble.placeholderImage', 'set');
    const { container } = render(
      <CometChatImagesBubble message={photos({ urls: [beach, dunes] })} alignment="left" placeholderImage="https://example.com/loading.png" />
    );
    const placeholders = container.querySelectorAll('img.cometchat-images-bubble__placeholder');
    expect([...placeholders].map(image => image.getAttribute('src'))).toEqual([
      'https://example.com/loading.png',
      'https://example.com/loading.png',
    ]);
    expect(screen.queryByRole('img', { name: 'Photo from Alice' })).toBeNull();

    loadPhotos();
    expect(container.querySelector('.cometchat-images-bubble__placeholder')).toBeNull();
    expect(screen.getAllByRole('img', { name: 'Photo from Alice' })).toHaveLength(2);
  });

  it('without placeholderImage the loading tile is the built-in box (its photo icon is drawn by CSS)', () => {
    covers('CometChatImagesBubble.placeholderImage', 'default');
    const { container } = render(<CometChatImagesBubble message={photos()} alignment="left" />);
    const placeholder = container.querySelector('.cometchat-images-bubble__placeholder');
    expect(placeholder?.tagName).toBe('DIV');
    expect(container.querySelector('img')).toBeNull();
  });

  it('textFormatters format the caption; with none it is drawn as written', () => {
    covers('CometChatImagesBubble.textFormatters', 'set', 'default');
    const message = photos({ caption: 'More at https://example.com/trip' });
    const view = render(<CometChatImagesBubble message={message} alignment="left" textFormatters={[new CometChatUrlFormatter()]} />);
    expect(screen.getByRole('link', { name: 'https://example.com/trip' })).toHaveAttribute('href', 'https://example.com/trip');
    view.unmount();

    const { container } = render(<CometChatImagesBubble message={message} alignment="left" />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(caption(container)).toHaveTextContent('More at https://example.com/trip');
  });
});
