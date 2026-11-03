/**
 * The public props of <CometChatMessageList /> that shape a message's options (the quick buttons
 * beside a bubble and its "More" menu), and the report dialog. Each `hide…Option` flag is checked
 * set, set to false and left out on the real list, against the options the same message offers
 * without it: the flag removes its own option and nothing else. Only the SDK is mocked; see
 * helpers/messageListPropsHarness.tsx.
 */
import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { CometChatMessageList } from '../CometChatMessageList';
import { resolvePinSaveFeatures } from '../../../utils/pinSaveFeatures';
import { covers } from '../../../testing/covers';
import {
  Kit,
  asUser,
  bob,
  bubbleText,
  chooseOption,
  history,
  installBrowser,
  me,
  optionTitles,
  quickOptionCount,
  resetHarness,
  row,
  sdk,
  show,
  showGroup,
  signIn,
  text,
  type ListProps,
} from './helpers/messageListPropsHarness';

vi.mock('@cometchat/chat-sdk-javascript', async () =>
  (await import('./helpers/messageListSdkMock')).mockSdkModule()
);

installBrowser();

beforeAll(async () => {
  await signIn();
});

beforeEach(() => {
  resetHarness();
});

/** A message on screen: which chat it is in, its id and its text. */
interface Shown {
  id: number;
  text: string;
  group?: boolean;
}

const theirs: Shown = { id: 1, text: 'Theirs' };
const mine: Shown = { id: 2, text: 'Mine' };
const theirsInGroup: Shown = { id: 3, text: 'Theirs, in the group', group: true };

function showChat() {
  history(
    text({ id: theirs.id, from: bob, text: theirs.text }),
    text({ id: mine.id, from: me, text: mine.text })
  );
}

function showGroupChat() {
  history(text({ id: theirsInGroup.id, from: bob, text: theirsInGroup.text, inGroup: true }));
}

/** The options `message` offers with `props` on the list. */
async function optionsWith(props: ListProps, message: Shown): Promise<string[]> {
  const view = message.group ? showGroup(props) : show(props);
  await bubbleText(message.text);
  const titles = optionTitles(row(view.container, message.id));
  view.unmount();
  return titles;
}

/**
 * Checks a `hide…` flag: left out and set to false, `title` is offered; set, the same options
 * are offered without it.
 */
async function expectHides(flag: keyof ListProps, title: string, message: Shown): Promise<void> {
  const offered = await optionsWith({}, message);
  expect(offered).toContain(title);
  expect(await optionsWith({ [flag]: false } as ListProps, message)).toEqual(offered);
  expect(await optionsWith({ [flag]: true } as ListProps, message)).toEqual(
    offered.filter(option => option !== title)
  );
}

describe('CometChatMessageList props: message options', () => {
  it('hideReactionOption removes "React"; offered by default', async () => {
    covers('CometChatMessageList.hideReactionOption', 'true', 'false', 'default');
    showChat();
    await expectHides('hideReactionOption', 'React', theirs);
  });

  it('hideReplyOption removes "Reply"; offered by default', async () => {
    covers('CometChatMessageList.hideReplyOption', 'true', 'false', 'default');
    showChat();
    await expectHides('hideReplyOption', 'Reply', theirs);
  });

  it('hideReplyInThreadOption removes "Reply in thread"; offered by default', async () => {
    covers('CometChatMessageList.hideReplyInThreadOption', 'true', 'false', 'default');
    showChat();
    await expectHides('hideReplyInThreadOption', 'Reply in thread', theirs);
  });

  it('hideThreadSubscriptionOption removes "Subscribe to thread" in a group chat; offered by default', async () => {
    covers('CometChatMessageList.hideThreadSubscriptionOption', 'true', 'false', 'default');
    showGroupChat();
    await expectHides('hideThreadSubscriptionOption', 'Subscribe to thread', theirsInGroup);
  });

  it('hideCopyMessageOption removes "Copy"; offered by default', async () => {
    covers('CometChatMessageList.hideCopyMessageOption', 'true', 'false', 'default');
    showChat();
    await expectHides('hideCopyMessageOption', 'Copy', theirs);
  });

  it('hideEditMessageOption removes "Edit" from my messages; offered by default', async () => {
    covers('CometChatMessageList.hideEditMessageOption', 'true', 'false', 'default');
    showChat();
    await expectHides('hideEditMessageOption', 'Edit', mine);
  });

  it('hideTranslateMessageOption removes "Translate"; offered by default', async () => {
    covers('CometChatMessageList.hideTranslateMessageOption', 'true', 'false', 'default');
    showChat();
    await expectHides('hideTranslateMessageOption', 'Translate', theirs);
  });

  it('hideMessageInfoOption removes "Info" from my messages; offered by default', async () => {
    covers('CometChatMessageList.hideMessageInfoOption', 'true', 'false', 'default');
    showChat();
    await expectHides('hideMessageInfoOption', 'Info', mine);
  });

  it('hideDeleteMessageOption removes "Delete" from my messages; offered by default', async () => {
    covers('CometChatMessageList.hideDeleteMessageOption', 'true', 'false', 'default');
    showChat();
    await expectHides('hideDeleteMessageOption', 'Delete', mine);
  });

  it("hideFlagMessageOption removes \"Report\" from other people's messages; offered by default", async () => {
    covers('CometChatMessageList.hideFlagMessageOption', 'true', 'false', 'default');
    showChat();
    await expectHides('hideFlagMessageOption', 'Report', theirs);
  });

  it('hideMessagePrivatelyOption removes "Message Privately" from group messages; offered by default', async () => {
    covers('CometChatMessageList.hideMessagePrivatelyOption', 'true', 'false', 'default');
    showGroupChat();
    await expectHides('hideMessagePrivatelyOption', 'Message Privately', theirsInGroup);
  });

  it('showMarkAsUnreadOption offers "Mark Unread" on messages I received; not offered by default', async () => {
    covers('CometChatMessageList.showMarkAsUnreadOption', 'true', 'false', 'default');
    showChat();
    const without = await optionsWith({}, theirs);
    expect(without).not.toContain('Mark Unread');
    expect(await optionsWith({ showMarkAsUnreadOption: false }, theirs)).toEqual(without);
    const withIt = await optionsWith({ showMarkAsUnreadOption: true }, theirs);
    expect(withIt).toContain('Mark Unread');
    expect(withIt.filter(option => option !== 'Mark Unread')).toEqual(without);
  });
});

describe('CometChatMessageList props: pin and save options', () => {
  /** Turn on one of the app's pin / save features before the list renders. */
  async function enable(feature: 'pin' | 'save') {
    if (feature === 'pin') sdk.isPinMessageEnabled.mockResolvedValue(true);
    else sdk.isSaveMessageEnabled.mockResolvedValue(true);
    await resolvePinSaveFeatures();
  }

  it('hidePinMessageOption removes "Pin message" when pinning is on; offered by default', async () => {
    covers('CometChatMessageList.hidePinMessageOption', 'true', 'false', 'default');
    await enable('pin');
    showChat();
    await expectHides('hidePinMessageOption', 'Pin message', theirs);
  });

  it('hideUnpinMessageOption removes "Unpin message" from a pinned message; offered by default', async () => {
    covers('CometChatMessageList.hideUnpinMessageOption', 'true', 'false', 'default');
    await enable('pin');
    history(text({ id: 1, from: bob, text: 'Pinned one', pinned: true }));
    await expectHides('hideUnpinMessageOption', 'Unpin message', { id: 1, text: 'Pinned one' });
  });

  it('hideSaveMessageOption removes "Save message" when saving is on; offered by default', async () => {
    covers('CometChatMessageList.hideSaveMessageOption', 'true', 'false', 'default');
    await enable('save');
    showChat();
    await expectHides('hideSaveMessageOption', 'Save message', theirs);
  });

  it('hideUnsaveMessageOption removes "Unsave message" from a saved message; offered by default', async () => {
    covers('CometChatMessageList.hideUnsaveMessageOption', 'true', 'false', 'default');
    await enable('save');
    history(text({ id: 1, from: bob, text: 'Saved one', saved: true }));
    await expectHides('hideUnsaveMessageOption', 'Unsave message', { id: 1, text: 'Saved one' });
  });
});

describe('CometChatMessageList props: quick options', () => {
  it('quickOptionsCount is how many options sit beside the bubble; the rest stay in "More"', async () => {
    covers('CometChatMessageList.quickOptionsCount', 'set');
    showChat();
    const all = await optionsWith({}, theirs);
    for (const count of [1, 4]) {
      const view = show({ quickOptionsCount: count });
      await bubbleText(theirs.text);
      const theirsRow = row(view.container, theirs.id);
      expect(quickOptionCount(theirsRow)).toBe(count);
      expect(optionTitles(theirsRow)).toEqual(all);
      view.unmount();
    }
  });
});

describe('CometChatMessageList props: the report dialog', () => {
  const report = async (container: HTMLElement) => {
    chooseOption(row(container, theirs.id), 'Report');
    return screen.findByRole('dialog');
  };

  it('hideFlagRemarkField removes the remark box from the report dialog; shown by default', async () => {
    covers('CometChatMessageList.hideFlagRemarkField', 'true', 'false', 'default');
    showChat();
    for (const [props, shown] of [
      [{ hideFlagRemarkField: true }, false],
      [{ hideFlagRemarkField: false }, true],
      [{}, true],
    ] as const) {
      const view = show(props);
      await bubbleText(theirs.text);
      const dialog = await report(view.container);
      expect(within(dialog).queryByRole('textbox') !== null).toBe(shown);
      view.unmount();
    }
    expect(sdk.getFlagReasons).toHaveBeenCalled();
  });

  it("hideFlagRemarkField on the list's View wins over the list's own", async () => {
    covers('CometChatMessageList.hideFlagRemarkField', 'overrides-context');
    showChat();
    const showWith = (root: boolean, view: boolean) =>
      render(
        <Kit>
          <CometChatMessageList.Root user={asUser(bob)} hideFlagRemarkField={root}>
            <CometChatMessageList.View hideFlagRemarkField={view} />
          </CometChatMessageList.Root>
        </Kit>
      );
    let view = showWith(false, true);
    await bubbleText(theirs.text);
    expect(within(await report(view.container)).queryByRole('textbox')).toBeNull();
    view.unmount();
    view = showWith(true, false);
    await bubbleText(theirs.text);
    expect(within(await report(view.container)).getByRole('textbox')).toBeInTheDocument();
  });
});
