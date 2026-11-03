/* eslint-disable @typescript-eslint/no-deprecated -- this file covers the deprecated legacy bubble's props */
/**
 * The public props of <CometChatImageBubble />, one case each: the prop is set (or left out) on the real
 * component and the test checks what it changes. Only the SDK is mocked (the logged-in user the bubble
 * looks up); jsdom never loads images, so each test decides when its photo has loaded.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatImageBubble } from '../CometChatImageBubble';
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

/** An image message from Alice (or `sender`), with an optional caption. */
function photo(options: { caption?: string; sender?: ReturnType<typeof buildUser> } = {}) {
  return {
    ...buildMediaMessage({ id: 5, type: 'image', sender: options.sender ?? alice, sentAt: tenDaysAgo }),
    getAttachments: () => [{ getUrl: () => 'https://example.com/beach.jpg', getSize: () => 2048 }],
    getCaption: () => options.caption ?? '',
    getData: () => ({}),
    getMentionedUsers: () => [],
  } as unknown as CometChat.MediaMessage;
}

const root = (container: HTMLElement) => container.firstElementChild as HTMLElement;
const caption = (container: HTMLElement) => container.querySelector('.cometchat-image-bubble__caption');
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

describe('CometChatImageBubble props', () => {
  describe('alignment', () => {
    it('right draws an outgoing bubble, caption included', () => {
      covers('CometChatImageBubble.alignment', 'right');
      const { container } = render(<CometChatImageBubble message={photo({ caption: 'Beach day', sender: bob })} alignment="right" />);
      expect(root(container)).toHaveClass('cometchat-image-bubble--outgoing');
      expect(root(container)).not.toHaveClass('cometchat-image-bubble--incoming');
      expect(caption(container)?.firstElementChild).toHaveClass('cometchat-text-bubble--outgoing');
    });

    it('left draws an incoming bubble, even for a photo the logged-in user sent', async () => {
      covers('CometChatImageBubble.alignment', 'left');
      theLoggedInUser(alice);
      const forced = render(<CometChatImageBubble message={photo({ caption: 'Beach day' })} alignment="left" />);
      const derived = render(<CometChatImageBubble message={photo({ caption: 'Beach day' })} />);
      // Once the logged-in user is known, the same photo without the prop turns outgoing.
      await waitFor(() => {
        expect(root(derived.container)).toHaveClass('cometchat-image-bubble--outgoing');
      });
      expect(root(forced.container)).toHaveClass('cometchat-image-bubble--incoming');
      expect(caption(forced.container)?.firstElementChild).toHaveClass('cometchat-text-bubble--incoming');
    });

    it("by default a photo the logged-in user sent is outgoing, anyone else's incoming", async () => {
      covers('CometChatImageBubble.alignment', 'default');
      theLoggedInUser(alice);
      const mine = render(<CometChatImageBubble message={photo({ sender: alice })} />);
      const theirs = render(<CometChatImageBubble message={photo({ sender: bob })} />);
      await waitFor(() => {
        expect(root(mine.container)).toHaveClass('cometchat-image-bubble--outgoing');
      });
      expect(loggedInUser).toHaveBeenCalledTimes(2);
      expect(root(theirs.container)).toHaveClass('cometchat-image-bubble--incoming');
    });
  });

  it('className is added to the bubble; by default it has only its own', () => {
    covers('CometChatImageBubble.className', 'set', 'default');
    const view = render(<CometChatImageBubble message={photo()} alignment="left" className="app-photo" />);
    expect(root(view.container)).toHaveClass('app-photo', 'cometchat-image-bubble');
    view.unmount();

    const { container } = render(<CometChatImageBubble message={photo()} alignment="left" />);
    expect([...root(container).classList]).toEqual([
      'cometchat-image-bubble',
      'cometchat-image-bubble--incoming',
      'cometchat-image-bubble--single',
    ]);
  });

  it('message is the photo drawn: its image, sender and caption', () => {
    covers('CometChatImageBubble.message', 'set');
    const { container } = render(<CometChatImageBubble message={photo({ caption: 'Beach day' })} alignment="left" />);
    loadPhotos();
    expect(screen.getByRole('img', { name: 'Photo from Alice' })).toHaveAttribute('src', 'https://example.com/beach.jpg');
    expect(screen.getByRole('button', { name: 'Image: Beach day. Press Enter to view fullscreen.' })).toBeInTheDocument();
    expect(caption(container)).toHaveTextContent('Beach day');
  });

  it('onImageClicked gets the attachment and its index, and the photo still opens full screen', async () => {
    covers('CometChatImageBubble.onImageClicked', 'called');
    const onImageClicked = vi.fn();
    render(<CometChatImageBubble message={photo()} alignment="left" onImageClicked={onImageClicked} />);
    loadPhotos();
    fireEvent.click(screen.getByRole('button', { name: 'Image message. Press Enter to view fullscreen.' }));
    expect(onImageClicked).toHaveBeenCalledWith({ url: 'https://example.com/beach.jpg', size: 2048 }, 0);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('placeholderImage is shown while the photo loads, then the photo replaces it', () => {
    covers('CometChatImageBubble.placeholderImage', 'set');
    const { container } = render(
      <CometChatImageBubble message={photo()} alignment="left" placeholderImage="https://example.com/loading.png" />
    );
    expect(container.querySelector('img.cometchat-image-bubble__placeholder')).toHaveAttribute('src', 'https://example.com/loading.png');
    expect(screen.queryByRole('img', { name: 'Photo from Alice' })).toBeNull();

    loadPhotos();
    expect(container.querySelector('.cometchat-image-bubble__placeholder')).toBeNull();
    expect(screen.getByRole('img', { name: 'Photo from Alice' })).toBeInTheDocument();
  });

  it('without placeholderImage the loading tile is the built-in box (its photo icon is drawn by CSS)', () => {
    covers('CometChatImageBubble.placeholderImage', 'default');
    const { container } = render(<CometChatImageBubble message={photo()} alignment="left" />);
    const placeholder = container.querySelector('.cometchat-image-bubble__placeholder');
    expect(placeholder?.tagName).toBe('DIV');
    expect(container.querySelector('img')).toBeNull();
  });

  it('textFormatters format the caption; with none it is drawn as written', () => {
    covers('CometChatImageBubble.textFormatters', 'set', 'default');
    const message = photo({ caption: 'More at https://example.com/trip' });
    const view = render(<CometChatImageBubble message={message} alignment="left" textFormatters={[new CometChatUrlFormatter()]} />);
    expect(screen.getByRole('link', { name: 'https://example.com/trip' })).toHaveAttribute('href', 'https://example.com/trip');
    view.unmount();

    const { container } = render(<CometChatImageBubble message={message} alignment="left" />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(caption(container)).toHaveTextContent('More at https://example.com/trip');
  });
});
