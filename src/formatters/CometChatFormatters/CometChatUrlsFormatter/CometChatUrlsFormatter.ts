import { CometChatTextFormatter } from "../CometChatTextFormatter";

/**
 * Class that handles the text formatting for URLs in CometChat.
 * CometChatUrlsFormatter is a child class of CometChatTextFormatter.
 * It extends the functionality of text formatting to specifically handle URLs.
 * It is used in extension decorators like  link preview, message translation, and dataSource utils. 
 */
export class CometChatUrlsFormatter extends CometChatTextFormatter {

  constructor(regexPatterns: Array<RegExp>) {
    super();
    this.setRegexPatterns(regexPatterns);
  }



  protected onRegexMatch(inputText?: string | null): string {
    let replacedText = inputText ?? "";
    for (let i = 0; i < this.regexPatterns.length; i++) {
      let regexPattern = this.regexPatterns[i];

      if (inputText) {
        replacedText = inputText.replace(regexPattern, (match, capturedGroup) => {

          const span = document.createElement('span');
          span.classList.add(this.cssClassMapping[0]);
          span.classList.add("cometchat-url")
          span.setAttribute('contentEditable', 'false');
          span.textContent = capturedGroup;
          span.dataset.captureGroup = capturedGroup;
          span.style.cursor = 'pointer';
          span.insertAdjacentText('beforeend', "\u200B"); // Zero-width space to ensure proper 
          return span.outerHTML + ' ';
        });
      }
    }
    return replacedText;
  }

  registerEventListeners(element: HTMLElement, classList: DOMTokenList) {
    for (let i = 0; i < classList.length; i++) {
      if (this.cssClassMapping.includes(classList[i])) {
        element.addEventListener('click', () => {
  
          // Get the URL from the data attribute
          let url = element.dataset.captureGroup;
  
          // Check if the URL starts with "www." and doesn't have a protocol
          if (url && !/^https?:\/\//i.test(url)) {
            // Prefix "http://" or "https://" if not present
            url = `https://${url}`;
          }
  
          // If the URL exists, open it in a new tab
          if (url) {
            window.open(url, '_blank');
          }
        });
      }
    }
    return element;
  }
  
}
