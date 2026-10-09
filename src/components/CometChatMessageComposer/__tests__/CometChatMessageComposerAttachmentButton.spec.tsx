/**
 * Unit tests for CometChatMessageComposerAttachmentButton.handleFileSelect.
 *
 * Covers both picker branches:
 *  (a) enableMultipleAttachments = true  -> selecting multiple files stages ALL
 *      of them via `stageAttachments` and does NOT call `sendMediaMessage`.
 *  (b) enableMultipleAttachments = false -> selecting a file calls
 *      `sendMediaMessage` once with the single file and does not stage.
 *
 * Requirements: 1.1, 1.6, 8.2
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { CometChatMessageComposerContextValue } from '../CometChatMessageComposer.types';

// --- Mocks ---------------------------------------------------------------

// Locale: return the key itself so options can be located by their key text.
vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({ getLocalizedString: (key: string) => key }),
}));

// The picker builds a real <input> against the top-level document, so the Files it yields belong
// to the SDK's realm. Catching it on click drives the selection without stubbing the document.
let pickedInput: HTMLInputElement | null = null;
let clickSpy: ReturnType<typeof vi.spyOn>;

/** The input the picker just opened, or a readable failure if it never opened one. */
function picker(): HTMLInputElement {
  if (!pickedInput) throw new Error('the attachment picker did not open an input');
  return pickedInput;
}

/** `files` is read-only on a real input, so the selection is defined onto it. */
function choose(files: File[]): void {
  Object.defineProperty(picker(), 'files', { value: fileList(files), configurable: true });
  picker().dispatchEvent(new Event('change'));
}

beforeAll(() => {
  clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {
    const calls = clickSpy.mock.instances;
    pickedInput = calls[calls.length - 1] as HTMLInputElement;
  });
});

afterAll(() => {
  clickSpy.mockRestore();
});

// Render the popover trigger and content inline so option buttons are visible.
vi.mock('../../base/CometChatPopover', () => ({
  CometChatPopover: ({
    trigger,
    content,
  }: {
    trigger: React.ReactNode;
    content: React.ReactNode;
  }) => (
    <div>
      {trigger}
      {content}
    </div>
  ),
}));

// CometChatCreatePoll is not exercised here; stub it to avoid SDK pulls.
vi.mock('../../CometChatCreatePoll/CometChatCreatePoll', () => ({
  CometChatCreatePoll: () => null,
}));

// Controllable context value used by the component under test.
const sendMediaMessage = vi.fn().mockResolvedValue(undefined);
const stageAttachments = vi.fn();
let contextValue: CometChatMessageComposerContextValue;

vi.mock('../CometChatMessageComposer.context', () => ({
  useCometChatMessageComposerContext: () => contextValue,
}));

import { CometChatMessageComposerAttachmentButton } from '../CometChatMessageComposerAttachmentButton';

function buildContext(
  overrides: Partial<CometChatMessageComposerContextValue>
): CometChatMessageComposerContextValue {
  return {
    contentToDisplay: 'attachments',
    setContentToDisplay: vi.fn(),
    sendMediaMessage,
    stageAttachments,
    enableMultipleAttachments: true,
    ...overrides,
  } as unknown as CometChatMessageComposerContextValue;
}

function fileList(files: File[]): FileList {
  const list = {
    length: files.length,
    item: (i: number) => files[i] ?? null,
    [Symbol.iterator]: function* () {
      yield* files;
    },
  } as unknown as FileList;
  files.forEach((f, i) => {
    (list as unknown as Record<number, File>)[i] = f;
  });
  return list;
}

describe('CometChatMessageComposerAttachmentButton.handleFileSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pickedInput = null;
  });

  it('multi-select enabled: stages ALL selected files and does NOT send immediately', async () => {
    contextValue = buildContext({ enableMultipleAttachments: true });
    const user = userEvent.setup();

    render(<CometChatMessageComposerAttachmentButton />);

    await user.click(screen.getByText('message_composer_attach_image'));

    // Picker opts into multi-select.
    expect(picker().multiple).toBe(true);

    const files = [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
      new File(['c'], 'c.png', { type: 'image/png' }),
    ];
    choose(files);

    expect(stageAttachments).toHaveBeenCalledTimes(1);
    // Files are staged with the chosen picker kind forced ('image' here).
    expect(stageAttachments).toHaveBeenCalledWith(files, 'image');
    expect(sendMediaMessage).not.toHaveBeenCalled();
  });

  it('flag false: sends the single selected file once and does not stage', async () => {
    contextValue = buildContext({ enableMultipleAttachments: false });
    const user = userEvent.setup();

    render(<CometChatMessageComposerAttachmentButton />);

    await user.click(screen.getByText('message_composer_attach_image'));

    // Legacy branch does not enable multi-select.
    expect(picker().multiple).toBe(false);

    const single = new File(['a'], 'a.png', { type: 'image/png' });
    choose([single]);

    expect(sendMediaMessage).toHaveBeenCalledTimes(1);
    expect(sendMediaMessage).toHaveBeenCalledWith(single, 'image');
    expect(stageAttachments).not.toHaveBeenCalled();
  });
});

describe('CometChatMessageComposerAttachmentButton — thread option gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows polls and collaborative options in the main composer (no parentMessageId)', () => {
    contextValue = buildContext({ parentMessageId: undefined });
    render(<CometChatMessageComposerAttachmentButton />);

    expect(screen.getByText('message_composer_polls')).toBeInTheDocument();
    expect(screen.getByText('messsage_composer_collaborative_document')).toBeInTheDocument();
    expect(screen.getByText('messsage_composer_collaborative_whiteboard')).toBeInTheDocument();
  });

  it('hides polls and collaborative options in the thread composer (parentMessageId set)', () => {
    contextValue = buildContext({ parentMessageId: 42 });
    render(<CometChatMessageComposerAttachmentButton />);

    // These are extension-backed and don't support a parent message.
    expect(screen.queryByText('message_composer_polls')).not.toBeInTheDocument();
    expect(screen.queryByText('messsage_composer_collaborative_document')).not.toBeInTheDocument();
    expect(
      screen.queryByText('messsage_composer_collaborative_whiteboard')
    ).not.toBeInTheDocument();

    // Regular file-attachment options remain available in threads.
    expect(screen.getByText('message_composer_attach_image')).toBeInTheDocument();
    expect(screen.getByText('message_composer_attach_file')).toBeInTheDocument();
  });
});
