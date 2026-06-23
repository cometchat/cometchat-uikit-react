/**
 * MentionManager — handles mention insertion, detection, and extraction.
 */

/** Insert a mention node at the current cursor position. */
export function insertMention(
  element: HTMLDivElement,
  id: string,
  label: string,
  charsToDelete: number,
  isSelf = false
): void {
  const sel = element.ownerDocument.defaultView?.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);

  if (charsToDelete > 0) {
    range.setStart(range.startContainer, Math.max(0, range.startOffset - charsToDelete));
    range.deleteContents();
  }

  const mention = element.ownerDocument.createElement('span');
  mention.className = isSelf
    ? 'cometchat-mention cometchat-mention--self cometchat-mentions cometchat-mentions-you'
    : 'cometchat-mention cometchat-mentions cometchat-mentions-other';
  mention.setAttribute('contenteditable', 'false');
  mention.setAttribute('data-uid', id);
  mention.setAttribute('data-mention-type', isSelf ? 'self' : 'other');
  mention.textContent = `@${label}`;

  range.insertNode(mention);

  const space = element.ownerDocument.createTextNode('\u00A0');
  mention.after(space);
  const newRange = element.ownerDocument.createRange();
  newRange.setStartAfter(space);
  newRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(newRange);
}

/** Convert editor content to CometChat mention format: <@uid:{uid}> */
export function getTextWithMentionFormat(element: HTMLDivElement): string {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-uid]').forEach(mention => {
    const uid = mention.getAttribute('data-uid') ?? '';
    mention.parentNode?.replaceChild(
      element.ownerDocument.createTextNode(`<@uid:${uid}>`),
      mention
    );
  });
  return clone.textContent ?? '';
}

/** Get the set of unique mention UIDs in the editor. */
export function getUniqueMentionUids(element: HTMLDivElement): Set<string> {
  const uids = new Set<string>();
  element.querySelectorAll('[data-uid]').forEach(el => {
    const uid = el.getAttribute('data-uid');
    if (uid) uids.add(uid);
  });
  return uids;
}

/** Check if @ was typed and invoke the mention callback. */
export function checkMentionTrigger(
  onMentionStart?: (query: string) => void,
  onMentionEnd?: () => void,
  win?: Window
): void {
  if (!onMentionStart) return;

  const sel = (win ?? window).getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  const textNode = range.startContainer;
  if (textNode.nodeType !== Node.TEXT_NODE) {
    onMentionEnd?.();
    return;
  }

  const text = textNode.textContent ?? '';
  const before = text.substring(0, range.startOffset);
  const atMatch = /(^|\s)@([^\s]*)$/.exec(before);

  if (atMatch) {
    onMentionStart(atMatch[2] ?? '');
  } else {
    onMentionEnd?.();
  }
}
