/**
 * Unit tests for the mention DOM helpers shared by the rich text editor and the
 * plain text composer.
 */
import { describe, it, expect } from 'vitest';
import { createMentionElement, getTextWithMentionFormat, getUniqueMentionUids } from '../mentions';

function buildInput(): HTMLDivElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

describe('createMentionElement', () => {
  it('marks a user mention as non-editable and tags it with the uid', () => {
    const node = createMentionElement(document, 'member5', 'Member 5');

    expect(node.getAttribute('data-uid')).toBe('member5');
    expect(node.getAttribute('data-mention-type')).toBe('other');
    expect(node.getAttribute('contenteditable')).toBe('false');
    expect(node.textContent).toBe('@Member 5');
    expect(node.className).toContain('cometchat-mentions');
  });

  it('uses the self/channel styling when isSelf is set', () => {
    const node = createMentionElement(document, 'all', 'all', true);

    expect(node.getAttribute('data-mention-type')).toBe('self');
    expect(node.className).toContain('cometchat-mentions-you');
  });
});

describe('getTextWithMentionFormat', () => {
  it('converts user mentions to <@uid:...> tokens', () => {
    const el = buildInput();
    el.appendChild(document.createTextNode('hey '));
    el.appendChild(createMentionElement(document, 'member5', 'Member 5'));
    el.appendChild(document.createTextNode(' ping'));

    expect(getTextWithMentionFormat(el)).toBe('hey <@uid:member5> ping');
  });

  it('converts the @all mention to an <@all:...> token, not a user token', () => {
    const el = buildInput();
    el.appendChild(createMentionElement(document, 'all', 'all', true));
    el.appendChild(document.createTextNode(' standup'));

    expect(getTextWithMentionFormat(el)).toBe('<@all:all> standup');
  });

  it('leaves plain text untouched', () => {
    const el = buildInput();
    el.textContent = 'no mentions here';

    expect(getTextWithMentionFormat(el)).toBe('no mentions here');
  });

  it('reports the unique uids present in the input', () => {
    const el = buildInput();
    el.appendChild(createMentionElement(document, 'member5', 'Member 5'));
    el.appendChild(createMentionElement(document, 'member5', 'Member 5'));
    el.appendChild(createMentionElement(document, 'member6', 'Member 6'));

    expect(getUniqueMentionUids(el)).toEqual(new Set(['member5', 'member6']));
  });
});
