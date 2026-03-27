import { CometChatTextFormatter } from "../CometChatTextFormatter";

/**
 * Class that handles the text formatting for URLs in CometChat.
 */
export class CometChatUrlsFormatter extends CometChatTextFormatter {

  constructor(regexPatterns: Array<RegExp>) {
    super();
    this.setRegexPatterns(regexPatterns);
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.key !== ' ' && event.key !== 'Enter') {
      return;
    }
    
    // Get selection from the input element's document context (supports iframe)
    const doc = this.inputElementReference?.ownerDocument;
    
    const sel = doc?.getSelection();
    
    if (!sel || sel.rangeCount === 0) {
      return;
    }
    
    const range = sel.getRangeAt(0);
    const textNode = range.startContainer;
    
    if (textNode.nodeType !== Node.TEXT_NODE) {
      return;
    }

    let anc: Node | null = textNode.parentNode;
    while (anc && anc !== this.inputElementReference) {
      if (anc.nodeType === Node.ELEMENT_NODE) {
        const tag = (anc as Element).tagName.toLowerCase();
        if (tag === 'code' || tag === 'pre') {
          return;
        }
      }
      anc = anc.parentNode;
    }

    const text = textNode.textContent || '';
    const caretPos = range.startOffset;
    // When Space is pressed, caret is after the space, so we need to look back
    const textBeforeCaret = text.substring(0, caretPos);
    const lastSpaceIndex = textBeforeCaret.lastIndexOf(' ');
    const lastWord = lastSpaceIndex >= 0 
      ? textBeforeCaret.substring(lastSpaceIndex + 1).trim()
      : textBeforeCaret.trim();
    
    if (!lastWord) {
      return;
    }

    for (const pattern of this.regexPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(lastWord + ' ');
      
      if (match && match[1]) {
        const url = match[1];
        
        const span = document.createElement('span');
        span.classList.add(this.cssClassMapping[0] || 'cometchat-url-class');
        span.classList.add('cometchat-url');
        span.setAttribute('contentEditable', 'false');
        span.textContent = url;
        span.dataset.captureGroup = url;
        span.style.cursor = 'pointer';

        const urlStart = lastSpaceIndex + 1;
        const urlEnd = caretPos - 1;
        const beforeText = text.substring(0, urlStart);
        const afterText = text.substring(urlEnd);
        const parent = textNode.parentNode;
        if (!parent) {
          return;
        }
        
        const beforeNode = document.createTextNode(beforeText);
        const afterNode = document.createTextNode(afterText);
        parent.insertBefore(beforeNode, textNode);
        parent.insertBefore(span, textNode);
        parent.insertBefore(afterNode, textNode);
        parent.removeChild(textNode);

        const newRange = document.createRange();
        newRange.setStart(afterNode, 1);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        
        return;
      }
    }
  }

  /**
   * DOM-based URL linkification for message bubbles.
   * Walks ALL text nodes and wraps URLs in clickable spans.
   * Never breaks HTML structure. URLs inside code blocks become clickable.
   * Only skips text inside <a> tags.
   */
  protected onRegexMatch(inputText?: string | null): string {
    if (!inputText) return inputText ?? "";

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = inputText;

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
        const parts: (string | HTMLSpanElement)[] = [];
        let lastIdx = 0;

        while ((match = regex.exec(content)) !== null) {
          const url = match[1] || match[0];
          if (match.index > lastIdx) {
            parts.push(content.slice(lastIdx, match.index));
          }
          const span = document.createElement('span');
          span.classList.add(this.cssClassMapping[0]);
          span.classList.add('cometchat-url');
          span.setAttribute('contentEditable', 'false');
          span.textContent = url;
          span.dataset.captureGroup = url;
          span.style.cursor = 'pointer';
          parts.push(span);
          lastIdx = match.index + match[0].length;
          if (match[0].length === 0) break;
        }

        if (parts.length > 0) {
          if (lastIdx < content.length) {
            parts.push(content.slice(lastIdx));
          }
          const fragment = document.createDocumentFragment();
          for (const part of parts) {
            if (typeof part === 'string') {
              fragment.appendChild(document.createTextNode(part));
            } else {
              fragment.appendChild(part);
            }
          }
          tNode.parentNode?.replaceChild(fragment, tNode);
          break;
        }
      }
    }

    const result = tempDiv.innerHTML;
    return result;
  }

  registerEventListeners(element: HTMLElement, classList: DOMTokenList) {
    for (let i = 0; i < classList.length; i++) {
      if (this.cssClassMapping.includes(classList[i])) {
        element.addEventListener('click', () => {
          let url = element.dataset.captureGroup;
          if (url && !/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
          }
          if (url) {
            window.open(url, '_blank');
          }
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

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = inputText;

    // Handle URL spans created by auto-detection
    const urlSpans = tempDiv.querySelectorAll("span.cometchat-url");
    for (let i = 0; i < urlSpans.length; i++) {
      const span = urlSpans[i];
      const url = (span as HTMLElement).dataset.captureGroup
        || (span.textContent || "").replace(/\u200B/g, "");
      const textNode = document.createTextNode(url);
      span.parentNode?.replaceChild(textNode, span);
    }

    // Handle anchor tags created by insertLink (paste or link dialog)
    const anchorTags = tempDiv.querySelectorAll("a");
    for (let i = 0; i < anchorTags.length; i++) {
      const anchor = anchorTags[i];
      const url = anchor.href || anchor.textContent || "";
      const textNode = document.createTextNode(url);
      anchor.parentNode?.replaceChild(textNode, anchor);
    }

    return tempDiv.innerHTML;
  }
}
