/**
 * The public props of <CometChatCreatePoll />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. Only the SDK is mocked: the polls extension a
 * new poll is sent to.
 *
 * `defaultAnswers` 'set' is not claimed: a value above 12 isn't capped (the known issue below).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCreatePoll } from '../CometChatCreatePoll';
import { buildGroup, buildTextMessage, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({ callExtension: vi.fn() }));

// The real SDK's constants (the kit reads them on import), with the extension call mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const { CometChat } = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>('@cometchat/chat-sdk-javascript');
  return { CometChat: Object.assign({}, CometChat, { callExtension: sdk.callExtension }) };
});

const bob = buildUser({ uid: 'bob', name: 'Bob' }) as unknown as CometChat.User;
const team = buildGroup({ guid: 'team', name: 'Team' }) as unknown as CometChat.Group;

/** The question field comes first, then one field per answer. */
const fields = () => screen.getAllByRole<HTMLInputElement>('textbox');
const questionField = () => fields()[0]!;
const answerFields = () => fields().slice(1);
const placeholders = (inputs: HTMLInputElement[]) => inputs.map(input => input.placeholder);
const createButton = () =>
  screen.getByRole('dialog').querySelector<HTMLButtonElement>('.cometchat-create-poll__create-button')!;
const removeButtons = () => screen.queryAllByRole('button', { name: /^Remove option/ });

/** Types a question and two answers, the least a poll needs. */
function fillIn() {
  fireEvent.change(questionField(), { target: { value: 'Lunch?' } });
  fireEvent.change(answerFields()[0]!, { target: { value: 'Pizza' } });
  fireEvent.change(answerFields()[1]!, { target: { value: 'Sushi' } });
}

/** Clicks Create and waits for the request to finish. */
async function create() {
  fireEvent.click(createButton());
  await waitFor(() => {
    expect(createButton()).not.toHaveTextContent('Creating...');
  });
}

beforeEach(() => {
  // The polls extension answers a created poll with { success: true }.
  sdk.callExtension.mockReset().mockResolvedValue({ success: true });
});

describe('CometChatCreatePoll props', () => {
  describe('texts', () => {
    it('title heads the dialog and names it; "Create Poll" by default', () => {
      covers('CometChatCreatePoll.title', 'set', 'default');
      const { unmount } = render(<CometChatCreatePoll title="Team survey" />);
      expect(screen.getByRole('dialog', { name: 'Team survey' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Team survey' })).toBeInTheDocument();
      expect(screen.queryByText('Create Poll')).toBeNull();
      unmount();

      render(<CometChatCreatePoll />);
      expect(screen.getByRole('dialog', { name: 'Create Poll' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Create Poll' })).toBeInTheDocument();
    });

    it('questionPlaceholderText is the question field placeholder; "Ask question" by default', () => {
      covers('CometChatCreatePoll.questionPlaceholderText', 'set', 'default');
      const { unmount } = render(<CometChatCreatePoll questionPlaceholderText="What should we ask?" />);
      expect(questionField()).toHaveAttribute('placeholder', 'What should we ask?');
      expect(placeholders(answerFields())).toEqual(['Add', 'Add']);
      unmount();

      render(<CometChatCreatePoll />);
      expect(questionField()).toHaveAttribute('placeholder', 'Ask question');
    });

    it("answerPlaceholderText is every answer field's placeholder, added ones too; \"Add\" by default", () => {
      covers('CometChatCreatePoll.answerPlaceholderText', 'set', 'default');
      const { unmount } = render(<CometChatCreatePoll answerPlaceholderText="An answer" />);
      expect(placeholders(answerFields())).toEqual(['An answer', 'An answer']);
      fireEvent.click(screen.getByRole('button', { name: '+ Add Option' }));
      expect(placeholders(answerFields())).toEqual(['An answer', 'An answer', 'An answer']);
      expect(questionField()).toHaveAttribute('placeholder', 'Ask question');
      unmount();

      render(<CometChatCreatePoll />);
      expect(placeholders(answerFields())).toEqual(['Add', 'Add']);
    });

    it('answerHelpText labels the answers; "Options" by default', () => {
      covers('CometChatCreatePoll.answerHelpText', 'set', 'default');
      const label = () => screen.getByRole('dialog').querySelector('.cometchat-create-poll__options-label');
      const { unmount } = render(<CometChatCreatePoll answerHelpText="Up to 12 answers" />);
      expect(label()).toHaveTextContent(/^Up to 12 answers$/);
      expect(screen.queryByText('Options')).toBeNull();
      unmount();

      render(<CometChatCreatePoll />);
      expect(label()).toHaveTextContent(/^Options$/);
    });

    it('addAnswerText labels the button that adds an answer; "Add Option" by default', () => {
      covers('CometChatCreatePoll.addAnswerText', 'set', 'default');
      const { unmount } = render(<CometChatCreatePoll addAnswerText="Another answer" />);
      expect(screen.queryByRole('button', { name: '+ Add Option' })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: '+ Another answer' }));
      expect(answerFields()).toHaveLength(3);
      unmount();

      render(<CometChatCreatePoll />);
      fireEvent.click(screen.getByRole('button', { name: '+ Add Option' }));
      expect(answerFields()).toHaveLength(3);
    });

    it('createPollButtonText labels the button that creates the poll; "Create" by default', async () => {
      covers('CometChatCreatePoll.createPollButtonText', 'set', 'default');
      const { unmount } = render(<CometChatCreatePoll user={bob} createPollButtonText="Ask the team" />);
      expect(screen.getByRole('button', { name: 'Ask the team' })).toBe(createButton());
      expect(screen.queryByRole('button', { name: 'Create' })).toBeNull();
      fillIn();
      await create();
      expect(sdk.callExtension).toHaveBeenCalledTimes(1);
      expect(createButton()).toHaveTextContent(/^Ask the team$/);
      unmount();

      render(<CometChatCreatePoll user={bob} />);
      expect(screen.getByRole('button', { name: 'Create' })).toBe(createButton());
    });
  });

  describe('answers', () => {
    it("opens with two answer fields by default, which can't be removed", () => {
      covers('CometChatCreatePoll.defaultAnswers', 'default');
      render(<CometChatCreatePoll />);
      expect(answerFields()).toHaveLength(2);
      expect(removeButtons()).toHaveLength(0);
    });

    it('defaultAnswers sets how many answer fields the form opens with, never fewer than two', () => {
      // Not claimed as defaultAnswers:set; see the known issue below.
      const { unmount } = render(<CometChatCreatePoll defaultAnswers={5} />);
      expect(answerFields()).toHaveLength(5);
      expect(removeButtons()).toHaveLength(5);
      unmount();

      render(<CometChatCreatePoll defaultAnswers={1} />);
      expect(answerFields()).toHaveLength(2);
      expect(removeButtons()).toHaveLength(0);
    });

    // Known issue: defaultAnswers is documented as "min 2, max 12", and the form never lets you add a
    // 13th answer, but the initial count is only floored at 2 (Math.max(2, defaultAnswers)), so 15
    // opens 15 fields. `it.fails` passes while the issue is there and fails as soon as this is fixed;
    // then change it back to `it` and claim CometChatCreatePoll.defaultAnswers 'set'.
    it.fails('defaultAnswers above 12 opens with 12 answer fields, the most a poll can have', () => {
      render(<CometChatCreatePoll defaultAnswers={15} />);
      expect(answerFields()).toHaveLength(12);
    });
  });

  describe('who the poll goes to', () => {
    it('user: the poll is sent to that user', async () => {
      covers('CometChatCreatePoll.user', 'set');
      render(<CometChatCreatePoll user={bob} />);
      fillIn();
      await create();
      expect(sdk.callExtension).toHaveBeenCalledTimes(1);
      expect(sdk.callExtension).toHaveBeenCalledWith('polls', 'POST', 'v2/create', {
        question: 'Lunch?',
        options: ['Pizza', 'Sushi'],
        receiver: 'bob',
        receiverType: 'user',
      });
    });

    it('group: the poll is sent to that group', async () => {
      covers('CometChatCreatePoll.group', 'set');
      render(<CometChatCreatePoll group={team} />);
      fillIn();
      await create();
      expect(sdk.callExtension).toHaveBeenCalledTimes(1);
      expect(sdk.callExtension).toHaveBeenCalledWith('polls', 'POST', 'v2/create', {
        question: 'Lunch?',
        options: ['Pizza', 'Sushi'],
        receiver: 'team',
        receiverType: 'group',
      });
    });

    it('with neither a user nor a group there is no one to send to: Create shows an error and sends nothing', () => {
      covers('CometChatCreatePoll.user', 'default');
      covers('CometChatCreatePoll.group', 'default');
      render(<CometChatCreatePoll />);
      fillIn();
      expect(createButton()).toBeEnabled();
      fireEvent.click(createButton());
      expect(screen.getByRole('alert')).toHaveTextContent('No receiver specified');
      expect(sdk.callExtension).not.toHaveBeenCalled();
    });

    it('replyToMessage sends the poll as a reply to that message; by default it is not a reply', async () => {
      covers('CometChatCreatePoll.replyToMessage', 'set', 'default');
      const quoted = buildTextMessage({ id: 4242, text: 'Where shall we eat?' }) as unknown as CometChat.BaseMessage;
      const { unmount } = render(<CometChatCreatePoll user={bob} replyToMessage={quoted} />);
      fillIn();
      await create();
      expect(sdk.callExtension).toHaveBeenLastCalledWith('polls', 'POST', 'v2/create', {
        question: 'Lunch?',
        options: ['Pizza', 'Sushi'],
        receiver: 'bob',
        receiverType: 'user',
        quotedMessageId: 4242,
      });
      unmount();

      render(<CometChatCreatePoll user={bob} />);
      fillIn();
      await create();
      expect(sdk.callExtension).toHaveBeenCalledTimes(2);
      expect(sdk.callExtension.mock.lastCall![3]).not.toHaveProperty('quotedMessageId');
    });
  });

  describe('callbacks', () => {
    it('onClose fires from the close button and from Escape', () => {
      covers('CometChatCreatePoll.onClose', 'called');
      const onClose = vi.fn();
      render(<CometChatCreatePoll onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalledTimes(1);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('onPollCreated fires once the extension has created the poll, and the dialog then asks to close', async () => {
      covers('CometChatCreatePoll.onPollCreated', 'called');
      let created!: (response: object) => void;
      sdk.callExtension.mockReturnValue(
        new Promise(resolve => {
          created = resolve;
        })
      );
      const onPollCreated = vi.fn();
      const onClose = vi.fn();
      render(<CometChatCreatePoll group={team} onPollCreated={onPollCreated} onClose={onClose} />);
      fillIn();
      fireEvent.click(createButton());
      expect(createButton()).toHaveTextContent('Creating...');
      expect(createButton()).toBeDisabled();
      expect(onPollCreated).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();

      created({ success: true });
      await waitFor(() => {
        expect(onPollCreated).toHaveBeenCalledTimes(1);
      });
      expect(onPollCreated).toHaveBeenCalledWith();
      expect(onClose).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(createButton()).toHaveTextContent(/^Create$/);
      });
    });

    it('onError gets the error when the extension fails, and the form says something went wrong', async () => {
      covers('CometChatCreatePoll.onError', 'called');
      const failure = new CometChat.CometChatException({
        code: 'ERR_EXTENSION_NOT_FOUND',
        message: 'The polls extension is not enabled',
      });
      sdk.callExtension.mockRejectedValue(failure);
      const onError = vi.fn();
      const onPollCreated = vi.fn();
      const onClose = vi.fn();
      render(<CometChatCreatePoll user={bob} onError={onError} onPollCreated={onPollCreated} onClose={onClose} />);
      fillIn();
      await create();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0]![0]).toBe(failure);
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
      expect(onPollCreated).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
