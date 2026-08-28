import { CometChatTextFormatter } from "../CometChatTextFormatter";

/**
 * Class that handles the text formatting for URLs in CometChat.
 * Real-time URL detection: as the user types, text matching a URL pattern
 * is wrapped in an editable <a> tag. On space/enter the link is locked down.
 */
export class CometChatUrlsFormatter extends CometChatTextFormatter {

  private enableRealtimeDetection: boolean = false;

  constructor(regexPatterns: Array<RegExp>) {
    super();
    this.setRegexPatterns(regexPatterns);
  }

  /** Enable real-time URL detection in the composer (only for compact composer) */
  setEnableRealtimeDetection(enabled: boolean): void {
    this.enableRealtimeDetection = enabled;
  }

  /**
   * Called on every keyUp. Detects URLs in real-time and wraps them in <a> tags.
   * Only active when enableRealtimeDetection is true (compact composer).
   */
  onKeyUp(event: KeyboardEvent) {
    if (!this.enableRealtimeDetection) return;

    const doc = this.inputElementReference?.ownerDocument;
    const sel = doc?.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const container = range.startContainer;

    // Skip if inside code/pre
    let anc: Node | null = container.parentNode;
    while (anc && anc !== this.inputElementReference) {
      if (anc.nodeType === Node.ELEMENT_NODE) {
        const tag = (anc as Element).tagName.toLowerCase();
        if (tag === 'code' || tag === 'pre') return;
      }
      anc = anc.parentNode;
    }

    const isSpaceOrEnter = event.key === ' ' || event.key === 'Enter';

    // --- Case A: Caret is inside an editable <a> (one we created during typing) ---
    const parentAnchor = this.getParentAnchor(container);
    // Only process anchors that WE created during real-time typing (marked with
    // data-realtime-url). Pre-existing links from the toolbar or loaded during
    // message editing must not be touched — their display text is intentionally
    // different from the href, so the matchesUrl check would incorrectly unwrap them.
    if (parentAnchor && parentAnchor.dataset.realtimeUrl && !parentAnchor.hasAttribute('contentEditable')) {
      const anchorText = parentAnchor.textContent || '';

      if (isSpaceOrEnter) {
        // Lock down the link: split off the trailing space, make anchor non-editable
        const trimmedUrl = anchorText.replace(/\s+$/, '');
        if (this.matchesUrl(trimmedUrl)) {
          // Finalize the anchor
          let href = trimmedUrl;
          if (/^www\./i.test(trimmedUrl)) href = 'https://' + trimmedUrl;
          parentAnchor.href = href;
          parentAnchor.textContent = trimmedUrl;
          parentAnchor.setAttribute('contentEditable', 'false');
          parentAnchor.style.color = 'var(--cometchat-link-button)';
          parentAnchor.style.cursor = 'pointer';
          delete parentAnchor.dataset.realtimeUrl;

          // Insert space after the anchor for continued typing
          const spaceNode = doc!.createTextNode('\u00A0');
          parentAnchor.parentNode?.insertBefore(spaceNode, parentAnchor.nextSibling);

          const newRange = doc!.createRange();
          newRange.setStart(spaceNode, spaceNode.length);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          // No longer a valid URL — unwrap the anchor
          this.unwrapAnchor(parentAnchor, doc!, sel);
        }
        return;
      }

      // Still typing inside the anchor — check if text still matches URL
      if (!this.matchesUrl(anchorText)) {
        // No longer matches — unwrap back to plain text
        this.unwrapAnchor(parentAnchor, doc!, sel);
      } else {
        // Update href as user types
        let href = anchorText;
        if (/^www\./i.test(anchorText)) href = 'https://' + anchorText;
        parentAnchor.href = href;
      }
      return;
    }

    // --- Case B: Caret is in a plain text node ---
    if (container.nodeType !== Node.TEXT_NODE) return;
    // Skip if inside a locked (contentEditable=false) anchor
    if (parentAnchor) return;

    const text = container.textContent || '';
    const caretPos = range.startOffset;

    // Check if the previous sibling is an editable <a> created by real-time
    // detection (user continued typing after anchor). Only merge into anchors
    // we created (data-realtime-url), not toolbar/edit-loaded links.
    const prevSibling = container.previousSibling;
    if (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE
        && (prevSibling as Element).tagName === 'A'
        && (prevSibling as HTMLElement).dataset.realtimeUrl
        && !(prevSibling as Element).hasAttribute('contentEditable')) {
      const prevAnchor = prevSibling as HTMLAnchorElement;
      // Only merge if there's no space — the text is a direct continuation of the URL
      if (text.length > 0 && !text.startsWith(' ')) {
        // Find how much of the text node to absorb (up to first space)
        const spaceIdx = text.indexOf(' ');
        const toAbsorb = spaceIdx >= 0 ? text.substring(0, spaceIdx) : text;
        const remaining = spaceIdx >= 0 ? text.substring(spaceIdx) : '';

        // Merge into the anchor
        const newUrlText = (prevAnchor.textContent || '') + toAbsorb;
        prevAnchor.textContent = newUrlText;
        let href = newUrlText;
        if (/^www\./i.test(newUrlText)) href = 'https://' + newUrlText;
        prevAnchor.href = href;

        // Update or remove the text node
        if (remaining) {
          (container as Text).textContent = remaining;
        } else {
          container.parentNode?.removeChild(container);
        }

        // If space was pressed, lock down the anchor
        if (isSpaceOrEnter) {
          prevAnchor.setAttribute('contentEditable', 'false');
          delete prevAnchor.dataset.realtimeUrl;
          const spaceNode = doc!.createTextNode('\u00A0');
          prevAnchor.parentNode?.insertBefore(spaceNode, prevAnchor.nextSibling);
          const newRange = doc!.createRange();
          newRange.setStart(spaceNode, spaceNode.length);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          // Place caret at end of anchor text
          const anchorTextNode = prevAnchor.firstChild;
          if (anchorTextNode) {
            const newRange = doc!.createRange();
            newRange.setStart(anchorTextNode, newUrlText.length);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
        }
        return;
      }
    }

    const textBeforeCaret = text.substring(0, caretPos);

    // Find the current word (from last space to caret)
    const lastSpaceIdx = textBeforeCaret.lastIndexOf(' ');
    const currentWord = (lastSpaceIdx >= 0
      ? textBeforeCaret.substring(lastSpaceIdx + 1)
      : textBeforeCaret);

    if (!currentWord || !this.matchesUrl(currentWord)) return;

    // Match found — wrap the URL portion in an editable <a>
    const urlStart = lastSpaceIdx >= 0 ? lastSpaceIdx + 1 : 0;
    const urlEnd = urlStart + currentWord.length;
    const beforeText = text.substring(0, urlStart);
    const urlText = text.substring(urlStart, urlEnd);
    const afterText = text.substring(urlEnd);

    let insertParent = container.parentNode;
    if (!insertParent) return;

    let href = urlText;
    if (/^www\./i.test(urlText)) href = 'https://' + urlText;

    const anchor = doc!.createElement('a');
    anchor.href = href;
    anchor.textContent = urlText;
    anchor.style.color = 'var(--cometchat-link-button)';
    anchor.style.cursor = 'pointer';
    anchor.dataset.realtimeUrl = 'true';
    // NOTE: no contentEditable="false" — the link stays editable while typing

    // If the text node is inside a formatting tag (b, i, u, s, strong, em),
    // break out of it so the link is not formatted
    const formattingTags = new Set(['B', 'I', 'U', 'S', 'STRONG', 'EM', 'STRIKE', 'DEL']);
    let formattingParent: HTMLElement | null = null;
    let node: Node | null = insertParent;
    while (node && node !== this.inputElementReference) {
      if (node.nodeType === Node.ELEMENT_NODE && formattingTags.has((node as Element).tagName)) {
        formattingParent = node as HTMLElement;
      }
      node = node.parentNode;
    }

    if (formattingParent) {
      // Split the formatting tag around the URL
      // Before: <b>text before URL|URL text|after text</b>
      // After:  <b>text before URL</b><a>URL text</a><b>after text</b>
      const fmtParent = formattingParent.parentNode;
      if (!fmtParent) return;

      // Clone the formatting tag for the "before" part
      if (beforeText) {
        const beforeFmt = formattingParent.cloneNode(false) as HTMLElement;
        beforeFmt.textContent = beforeText;
        fmtParent.insertBefore(beforeFmt, formattingParent);
      }

      // Insert the anchor (outside formatting)
      fmtParent.insertBefore(anchor, formattingParent);

      // Clone the formatting tag for the "after" part
      if (afterText) {
        const afterFmt = formattingParent.cloneNode(false) as HTMLElement;
        afterFmt.textContent = afterText;
        fmtParent.insertBefore(afterFmt, formattingParent);
      }

      // Remove the original formatting tag
      fmtParent.removeChild(formattingParent);
    } else {
      // No formatting parent — simple insert
      if (beforeText) insertParent.insertBefore(doc!.createTextNode(beforeText), container);
      insertParent.insertBefore(anchor, container);
      if (afterText) insertParent.insertBefore(doc!.createTextNode(afterText), container);
      insertParent.removeChild(container);
    }

    // Place caret at end of the anchor's text
    const anchorTextNode = anchor.firstChild;
    if (anchorTextNode) {
      const newRange = doc!.createRange();
      newRange.setStart(anchorTextNode, urlText.length);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  }

  /** Check if text matches any URL pattern */
  /** Check if text matches a valid URL pattern for real-time detection.
   *  Uses a stricter regex than the one passed to the constructor to avoid
   *  false positives like "www.g" while typing. */
  private matchesUrl(text: string): boolean {
    const strictUrlRegex = /^(https?:\/\/)([\w\-\.]+\.[\w\-\.]+|[\w\-]+:\d+)(\/[\S]*)?$|^(www\.)[\w\-\.]+\.[\w\-\.]+(\/([\S]+)?)?$/i;
    return strictUrlRegex.test(text);
  }

  /** Find parent <a> element (if any) */
  private getParentAnchor(node: Node): HTMLAnchorElement | null {
    let current: Node | null = node;
    while (current && current !== this.inputElementReference) {
      if (current.nodeType === Node.ELEMENT_NODE && (current as Element).tagName === 'A') {
        return current as HTMLAnchorElement;
      }
      current = current.parentNode;
    }
    return null;
  }

  /** Unwrap an anchor back to plain text, preserving caret position */
  private unwrapAnchor(anchor: HTMLAnchorElement, doc: Document, sel: Selection) {
    const textContent = anchor.textContent || '';
    const textNode = doc.createTextNode(textContent);
    anchor.parentNode?.replaceChild(textNode, anchor);
    const newRange = doc.createRange();
    newRange.setStart(textNode, textContent.length);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  /**
   * DOM-based URL linkification for message bubbles.
   */
  protected onRegexMatch(inputText?: string | null): string {
    if (!inputText) return inputText ?? "";

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = inputText;
    // Re-serializing escapes &, < and > in text, so the input is returned untouched unless
    // a URL was actually linkified.
    let didLinkify = false;

    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    let current: Text | null;
    while ((current = walker.nextNode() as Text | null)) {
      textNodes.push(current);
    }

    for (const tNode of textNodes) {
      let parent: Node | null = tNode.parentNode;
      let insideAnchor = false;
      while (parent && parent !== tempDiv) {
        if (parent.nodeType === Node.ELEMENT_NODE && (parent as Element).tagName.toLowerCase() === 'a') {
          insideAnchor = true;
          break;
        }
        parent = parent.parentNode;
      }
      if (insideAnchor) continue;

      const content = tNode.textContent || '';
      if (!content.trim()) continue;

      for (const pattern of this.regexPatterns) {
        const regex = new RegExp(pattern.source, pattern.flags.replace('g', '') + 'g');
        let match: RegExpExecArray | null;
        const parts: (string | HTMLAnchorElement)[] = [];
        let lastIdx = 0;

        while ((match = regex.exec(content)) !== null) {
          const url = match[1] || match[0];
          if (match.index > lastIdx) parts.push(content.slice(lastIdx, match.index));
          const anchor = document.createElement('a');
          let href = url;
          if (/^www\./i.test(url)) href = 'https://' + url;
          anchor.href = href;
          anchor.textContent = url;
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          // No inline color — message bubble link styling comes from CSS
          anchor.style.cursor = 'pointer';
          parts.push(anchor);
          lastIdx = match.index + match[0].length;
          if (match[0].length === 0) break;
        }

        if (parts.length > 0) {
          if (lastIdx < content.length) parts.push(content.slice(lastIdx));
          const fragment = document.createDocumentFragment();
          for (const part of parts) {
            if (typeof part === 'string') {
              fragment.appendChild(document.createTextNode(part));
            } else {
              fragment.appendChild(part);
            }
          }
          tNode.parentNode?.replaceChild(fragment, tNode);
          didLinkify = true;
          break;
        }
      }
    }

    return didLinkify ? tempDiv.innerHTML : inputText;
  }

  registerEventListeners(element: HTMLElement, classList: DOMTokenList) {
    for (let i = 0; i < classList.length; i++) {
      if (this.cssClassMapping.includes(classList[i])) {
        element.addEventListener('click', () => {
          let url = element.dataset.captureGroup;
          if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
          if (url) window.open(url, '_blank');
        });
      }
    }
    return element;
  }

  formatComposerContent(_element: HTMLElement): void {
    return;
  }

  getOriginalText(inputText: string | null | undefined): string {
    if (!inputText) return "";
    if (!inputText.includes("cometchat-url") && !inputText.includes("<a")) return inputText;

    const mentionPlaceholders: string[] = [];
    let safeInput = inputText.replace(/<@(?:uid|all):[^>]+>/g, (match) => {
      const idx = mentionPlaceholders.length;
      mentionPlaceholders.push(match);
      return `\u200B__MENTION_${idx}__\u200B`;
    });

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = safeInput;

    // Handle legacy URL spans
    const urlSpans = tempDiv.querySelectorAll("span.cometchat-url");
    for (let i = 0; i < urlSpans.length; i++) {
      const span = urlSpans[i];
      const url = (span as HTMLElement).dataset.captureGroup
        || (span.textContent || "").replace(/\u200B/g, "");
      span.parentNode?.replaceChild(document.createTextNode(url), span);
    }

    // Handle anchor tags
    const anchorTags = tempDiv.querySelectorAll("a");
    for (let i = 0; i < anchorTags.length; i++) {
      const anchor = anchorTags[i];
      anchor.parentNode?.replaceChild(document.createTextNode(anchor.textContent || ""), anchor);
    }

    let result = tempDiv.innerHTML;

    // Restore mention tokens
    result = result.replace(/\u200B__MENTION_(\d+)__\u200B/g, (_, idx) => {
      return mentionPlaceholders[parseInt(idx, 10)];
    });

    return result;
  }
}
