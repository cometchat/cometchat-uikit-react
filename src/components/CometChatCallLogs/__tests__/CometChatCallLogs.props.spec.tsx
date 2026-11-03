/**
 * The public props of <CometChatCallLogs />, one case each: the prop is set (or left out) on the real
 * component and the test checks what it changes. The SDKs are mocked, and so are the call buttons,
 * which run a whole call on their own; their props are checked in their own spec.
 *
 * The state views, itemView, trailingView and the click callbacks are covered in
 * CometChatCallLogs.spec.tsx.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { CometChatCallLogs } from '../CometChatCallLogs';
import { LocaleContext } from '../../../context/locale/LocaleContext';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({
  fetchNext: vi.fn(),
  getLoggedinUser: vi.fn(),
  setLimit: vi.fn(),
  setCallCategory: vi.fn(),
  setAuthToken: vi.fn(),
  callButtons: vi.fn(),
}));

// The real SDK's constants (the kit reads them on import), with only the login mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const { CometChat } = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>('@cometchat/chat-sdk-javascript');
  return { CometChat: Object.assign({}, CometChat, { getLoggedinUser: sdk.getLoggedinUser }) };
});

vi.mock('../../../CometChatUIKit/CometChatCalls', () => ({
  CometChatUIKitCalls: {
    CallLogRequestBuilder: vi.fn(function (this: Record<string, unknown>) {
      this.setLimit = sdk.setLimit.mockReturnValue(this);
      this.setCallCategory = sdk.setCallCategory.mockReturnValue(this);
      this.setAuthToken = sdk.setAuthToken.mockReturnValue(this);
      this.build = () => ({ fetchNext: sdk.fetchNext });
    }),
  },
}));

vi.mock('../../CometChatCallButtons/CometChatCallButtons', () => ({
  CometChatCallButtons: (props: Record<string, unknown>) => {
    sdk.callButtons(props);
    return <div data-testid="call-buttons" />;
  },
}));

const me = { getUid: () => 'me', getName: () => 'Me', getAuthToken: () => 'auth-token' };
const tenDaysAgo = Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60;

function callLog(sessionId: string, name: string) {
  const other = { getUid: () => name.toLowerCase(), getName: () => name, getAvatar: () => '' };
  return {
    getSessionID: () => sessionId,
    getInitiator: () => me,
    getReceiver: () => other,
    getCallInitiator: () => me,
    getType: () => 'audio',
    getStatus: () => 'ended',
    getInitiatedAt: () => tenDaysAgo,
    type: 'audio',
    initiatedAt: tenDaysAgo,
  };
}

const alice = callLog('s-alice', 'Alice');
const bob = callLog('s-bob', 'Bob');

const loaded = () => screen.findByText('Alice');
function row(name: string): HTMLElement {
  const item = screen.getByText(name).closest<HTMLElement>('.cometchat-call-logs__list-item');
  if (!item) throw new Error(`no call log row for ${name}`);
  return item;
}

/** An app whose calendar format dates older calls as month-year. */
const Calendar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const locale = React.useContext(LocaleContext);
  return <LocaleContext.Provider value={{ ...locale, calendarObject: { otherDays: 'MM-YYYY' } }}>{children}</LocaleContext.Provider>;
};

beforeEach(() => {
  sdk.fetchNext.mockReset().mockResolvedValue([alice, bob]);
  sdk.getLoggedinUser.mockReset().mockResolvedValue(me);
  sdk.setLimit.mockClear();
  sdk.setCallCategory.mockClear();
  sdk.setAuthToken.mockClear();
  sdk.callButtons.mockClear();
});

describe('CometChatCallLogs props', () => {
  describe('request builder', () => {
    it("without a builder, fetches 30 of the user's calls at a time", async () => {
      covers('CometChatCallLogs.callLogRequestBuilder', 'default');
      render(<CometChatCallLogs />);
      await loaded();
      expect(sdk.setLimit).toHaveBeenCalledWith(30);
      expect(sdk.setCallCategory).toHaveBeenCalledWith('call');
      expect(sdk.setAuthToken).toHaveBeenCalledWith('auth-token');
    });

    it("an app's builder is the one fetched from", async () => {
      covers('CometChatCallLogs.callLogRequestBuilder', 'used');
      const fetchNext = vi.fn().mockResolvedValue([callLog('s-carol', 'Carol')]);
      const builder = { build: vi.fn(() => ({ fetchNext })) };
      render(<CometChatCallLogs callLogRequestBuilder={builder} />);
      expect(await screen.findByText('Carol')).toBeInTheDocument();
      expect(sdk.fetchNext).not.toHaveBeenCalled();
    });
  });

  it('onError gets the error when fetching fails', async () => {
    covers('CometChatCallLogs.onError', 'called');
    const error = { code: 'ERR', message: 'no network' };
    sdk.fetchNext.mockRejectedValue(error);
    const onError = vi.fn();
    render(<CometChatCallLogs onError={onError} />);
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it('activeCall highlights that row; by default none is', async () => {
    covers('CometChatCallLogs.activeCall', 'set', 'default');
    const { unmount } = render(<CometChatCallLogs activeCall={bob} />);
    await loaded();
    expect(row('Bob')).toHaveClass('cometchat-call-logs__list-item-active');
    expect(row('Alice')).not.toHaveClass('cometchat-call-logs__list-item-active');
    unmount();

    const { container } = render(<CometChatCallLogs />);
    await loaded();
    expect(container.querySelector('.cometchat-call-logs__list-item-active')).toBeNull();
  });

  it('showScrollbar shows the list scrollbar; hidden by default', async () => {
    covers('CometChatCallLogs.showScrollbar', 'true', 'false', 'default');
    for (const [props, hidden] of [
      [{ showScrollbar: true }, false],
      [{ showScrollbar: false }, true],
      [{}, true],
    ] as const) {
      const { container, unmount } = render(<CometChatCallLogs {...props} />);
      await loaded();
      expect(container.querySelector('.cometchat-call-logs')?.classList.contains('cometchat-call-logs-hide-scrollbar')).toBe(hidden);
      unmount();
    }
  });

  it('callSettingsBuilder goes to the call buttons; by default they get none and use the global one', async () => {
    covers('CometChatCallLogs.callSettingsBuilder', 'set', 'default');
    const settings = { tag: 'app settings' };
    const { unmount } = render(<CometChatCallLogs callSettingsBuilder={settings} />);
    await loaded();
    expect(sdk.callButtons).toHaveBeenCalledWith(expect.objectContaining({ callSettingsBuilder: settings }));
    unmount();

    sdk.callButtons.mockClear();
    render(<CometChatCallLogs />);
    await loaded();
    expect(sdk.callButtons).toHaveBeenCalled();
    for (const [props] of sdk.callButtons.mock.calls as [Record<string, unknown>][]) {
      expect(props.callSettingsBuilder).toBeUndefined();
    }
  });

  it('callInitiatedDateTimeFormat sets how calls are dated, over the global format; by default day, month and time', async () => {
    covers('CometChatCallLogs.callInitiatedDateTimeFormat', 'set', 'default');
    const date = () => within(row('Alice')).getByRole('time', { hidden: true }).textContent ?? '';
    const year = String(new Date(tenDaysAgo * 1000).getFullYear());

    let view = render(<CometChatCallLogs />);
    await loaded();
    expect(date()).toMatch(/^\d{2} \w{3}, \d{2}:\d{2} [AP]M$/);
    view.unmount();

    view = render(<CometChatCallLogs callInitiatedDateTimeFormat={{ otherDays: 'YYYY' }} />);
    await loaded();
    expect(date()).toBe(year);
    view.unmount();

    // A format for today only leaves older calls on the default.
    view = render(<CometChatCallLogs callInitiatedDateTimeFormat={{ today: 'hh:mm' }} />);
    await loaded();
    expect(date()).toMatch(/^\d{2} \w{3}, \d{2}:\d{2} [AP]M$/);
    view.unmount();

    // The app's calendar format applies, and the prop wins over it.
    view = render(
      <Calendar>
        <CometChatCallLogs />
      </Calendar>
    );
    await loaded();
    expect(date()).toMatch(/^\d{2}-\d{4}$/);
    view.unmount();
    render(
      <Calendar>
        <CometChatCallLogs callInitiatedDateTimeFormat={{ otherDays: 'YYYY' }} />
      </Calendar>
    );
    await loaded();
    expect(date()).toBe(year);
  });

  it('leadingView, titleView and subtitleView replace the avatar, the name and the call time', async () => {
    covers('CometChatCallLogs.leadingView', 'custom');
    covers('CometChatCallLogs.titleView', 'custom');
    covers('CometChatCallLogs.subtitleView', 'custom');
    const name = (call: typeof alice) => call.getReceiver().getName();
    const { container } = render(
      <CometChatCallLogs
        leadingView={call => <b>lead-{name(call)}</b>}
        titleView={call => <span>title-{name(call)}</span>}
        subtitleView={call => <i>sub-{name(call)}</i>}
      />
    );
    const item = (await screen.findByText('title-Alice')).closest('.cometchat-call-logs__list-item');
    expect(item).toHaveTextContent('lead-Alice');
    expect(item).toHaveTextContent('sub-Alice');
    expect(screen.queryByText('Alice')).toBeNull();
    expect(container.querySelector('.cometchat-avatar')).toBeNull();
    expect(container.querySelector('time')).toBeNull();
  });

  it('onCallButtonClicked replaces the call buttons with one that reports the call, not the row', async () => {
    covers('CometChatCallLogs.onCallButtonClicked', 'called');
    const onCallButtonClicked = vi.fn();
    const onItemClick = vi.fn();
    render(<CometChatCallLogs onCallButtonClicked={onCallButtonClicked} onItemClick={onItemClick} />);
    await loaded();
    expect(screen.queryByTestId('call-buttons')).toBeNull();
    fireEvent.click(within(row('Bob')).getByRole('button', { name: /voice call/i }));
    expect(onCallButtonClicked).toHaveBeenCalledWith(bob);
    expect(onItemClick).not.toHaveBeenCalled();
  });
});
