
import { CometChatUIKitLoginListener } from "../../CometChatUIKit/CometChatUIKitLoginListener";
import { MentionsTargetElement, MessageBubbleAlignment } from "../../Enums/Enums";
import { CometChatUtilityConstants } from "../../constants/CometChatUtilityConstants";
import { ComposerId } from "../../utils/MessagesDataSource";

/**
 * Abstract class that provides methods for formatting text in CometChat.
 * It is used in CometChatMessageComposer, CometChatConversations, CometChatMessageList components and extension decorators.
 */
export abstract class CometChatTextFormatter {
  /**
   * An ID for tracking the timeout.
   */
  protected timeoutID?: number;

  /**
   * A flag to start tracking once a specific keyboard event occurs.
   */
  protected startTracking: boolean = true;

  /**
   * Current position/type of the text selection or cursor in the text input field.
   */
  protected currentCaretPosition?: Selection;

  /**
   * Represents the text range that the user has selected or the cursor position in the text input field.
   */
  protected currentRange?: Range;

  /**
   * Reference to the text input field DOM element.
   */
  protected inputElementReference?: HTMLElement;

  /**
   * The regex patterns to find specific text pattern in the user input text.
   */
  protected regexPatterns = [/(@\w+)/g];

  /**
   * The regex patterns to replace text formatting in the user input text.
   */
  protected regexToReplaceFormatting = [
    /<span class="hash"[^>]*>([^<]*)<span class="hash-margin-space">[^<]*<\/span><\/span> /g,
  ];

  /**
   * Mapping of CSS classes for styling the text.
   */
  protected cssClassMapping: Array<string> = ["custom-class"];

  /**
   * The character to track once typed in the text input field.
   */
  protected trackCharacter: string = "#";

  /**
   * Callback function to be triggered on the 'keyup' event.
   */
  protected keyUpCallBack!: Function;

  /**
   * Callback function to be triggered on the 'keydown' event.
   */
  protected keyDownCallBack!: Function;

  protected classes: string[] = [];

  /**
   * Function reference to trigger a re-render of the component.
   */
  public reRender!: Function;

  public messageBubbleAlignment!: MessageBubbleAlignment;

  /**
   * The message object in context.
   */
  protected messageObject!: CometChat.BaseMessage;

  user?: CometChat.User;
  group?: CometChat.Group;
  composerId?: ComposerId;


  /**
   * The user who is currently logged in.
   */
  protected loggedInUser?: CometChat.User | null =
    CometChatUIKitLoginListener.getLoggedInUser();

  protected id?: string;

  protected textStyle: { [key: string]: string } = {
    formattedTextColor: "rgb(51, 153, 255)",
    formattedTextFont: "",
  };

  /**
   * Sets the current caret position and selection range.
   *
   * @param {Selection} currentCaretPosition - The current caret position.
   * @param {Range} currentRange - The current selection range.
   */
  setCaretPositionAndRange(
    currentCaretPosition: Selection,
    currentRange: Range
  ) {
    this.currentCaretPosition = currentCaretPosition;
    this.currentRange = currentRange?.cloneRange();
  }

  /**
   * Set css class to be applied on format spans
   */
  setClasses(classes: string[]) {
    this.classes = classes;
  }

  /**
   * Sets the regex patterns to match.
   * @param regexPatterns - Array of regex patterns.
   */
  setRegexPatterns(regexPatterns: Array<RegExp>) {
    this.regexPatterns = regexPatterns;
  }

  /**
   * Gets the regex patterns.
   */
  getRegexPatterns() {
    return this.regexPatterns;
  }

  /**
   * Sets the regex patterns to replace formatting.
   * @param regexToReplaceFormatting - Array of regex patterns.
   */
  setRegexToReplaceFormatting(regexToReplaceFormatting: Array<RegExp>) {
    this.regexToReplaceFormatting = regexToReplaceFormatting;
  }

  /**
   * Sets the tracking character.
   * @param trackCharacter - The character to track.
   */
  setTrackingCharacter(trackCharacter: string) {
    this.trackCharacter = trackCharacter;
  }

  /**
   * Sets the input element reference.
   * @param inputElementReference - The reference to the input element.
   */
  setInputElementReference(inputElementReference: HTMLElement) {
    this.inputElementReference = inputElementReference;
  }

  /**
   * Sets the re-render function.
   * @param reRender - The function to call for re-rendering.
   */
  setReRender(reRender: Function) {
    this.reRender = reRender;
  }

  /**
   * Retrieves the keydown callback function.
   * @returns {Function} The keydown callback function.
   */
  getKeyUpCallBack(): Function {
    return this.keyUpCallBack;
  }

  /**
   * Sets the keydown callback function.
   * @param {Function} keyUpCallBack - The callback function for handling key down events.
   */
  setKeyUpCallBack(keyUpCallBack: Function) {
    this.keyUpCallBack = keyUpCallBack;
  }

  /**
   * Retrieves the keydown callback function.
   * @returns {Function} The keydown callback function.
   */
  getKeyDownCallBack(): Function {
    return this.keyDownCallBack;
  }

  /**
   * Sets the keydown callback function.
   * @param {Function} keyDownCallBack - The keydown callback function.
   */
  setKeyDownCallBack(keyDownCallBack: Function) {
    this.keyDownCallBack = keyDownCallBack;
  }

  /**
   * Retrieves the currently logged in user.
   * @returns The currently logged user.
   */
  getLoggedInUser() {
    return this.loggedInUser;
  }

  /**
   * Sets the currently logged in user.
   * @param {CometChat.User} loggedInUser - The user to set as currently logged in.
   */
  setLoggedInUser(loggedInUser: CometChat.User) {
    this.loggedInUser = loggedInUser;
  }

  /**
   * Sets the mapping of CSS classes.
   * @param cssClassesNames - Array of CSS class names.
   */
  setCssClassMapping(cssClassesNames: string[]) {
    this.cssClassMapping = cssClassesNames;
  }

  /**
   * Sets the CSS style.
   * @param {Object} styleObject - The CSS style object.
   * @param {string} styleObject.formattedTextColor - The color to use for formatted text.
   */
  setStyle(styleObject: {
    formattedTextColor: string;
    formattedTextFont: string;
  }) {
    this.textStyle = styleObject;
  }

  getStyle() {
    return this.textStyle;
  }

  setId(id: string) {
    this.id = id;
  }

  getId() {
    return this.id;
  }

  cleanup() { }

  /**
   * If the input text is provided, it returns the formatted text. Otherwise, it edits the text using the current cursor position.
   * @param {string|null} inputText - The text to format.
   * @return {string|void} - The original or formatted input text, or void if editing was done based on cursor position.
   */
  getFormattedText(inputText: string, params: { mentionsTargetElement: MentionsTargetElement }): string | void {
    return this.onRegexMatch(inputText);
  }

  getFormattedTextForEntity(entity: any): void {
    return;
  }

  /**
   * Sets the message object.
   *
   * @param {CometChat.BaseMessage} messageObject - The message object to be set.
   */
  setMessage(messageObject: CometChat.BaseMessage) {
    this.messageObject = messageObject;
  }

  /**
   * Retrieves the message object.
   *
   * @returns {CometChat.BaseMessage} - The current message object.
   */
  getMessage() {
    return this.messageObject;
  }

  setMessageBubbleAlignment(messageBubbleAlignment: MessageBubbleAlignment) {
    this.messageBubbleAlignment = messageBubbleAlignment;
  }

  getMessageBubbleAlignment() {
    return this.messageBubbleAlignment;
  }

  setComposerConfig(user?: CometChat.User, group?: CometChat.Group, composerId?: ComposerId) {
    this.user = user;
    this.group = group;
    this.composerId = composerId;
  }


  getComposerConfig() {
    return { user: this.user, group: this.group, composerId: this.composerId }
  }

  /**
   * Formats the text on keyboard key down.
   * @param {string|void} inputText - The text to format.
   */
  protected formatTextOnKeyUp = (inputText: string | void) => {
    if (!inputText) {
      const textToLeft = this.getPrecedingText(
        this.currentCaretPosition,
        this.currentRange
      );
      if (textToLeft) {
        let updatedText = this.onRegexMatch(textToLeft);
        this.addAtCaretPosition(
          updatedText,
          this.currentCaretPosition!,
          this.currentRange!
        );
      }
      return;
    }
  };

  public debouncedFormatTextOnKeyUp = this.debounce(
    this.formatTextOnKeyUp,
    CometChatUtilityConstants.TextFormatter.KEY_UP_DEBOUNCE_TIME
  );

  /**
   * Retrieves the preceding text from the given caret position.
   * @param {Selection} currentCaretPosition - The current caret position.
   * @param {Range} currentRange - The current selection range.
   * @return {string|null} - The preceding text or null.
   */
  protected getPrecedingText(
    currentCaretPosition: Selection | undefined,
    currentRange: Range | undefined
  ): string | null {
    if (this.inputElementReference && currentRange) {
      const rangeCopy = currentRange.cloneRange();
      while (
        rangeCopy.startOffset > 0 &&
        rangeCopy.startContainer.textContent?.charAt(
          rangeCopy.startOffset - 1
        ) !== this.trackCharacter
      ) {
        rangeCopy.setStart(rangeCopy.startContainer, rangeCopy.startOffset - 1);

        /** if the container is not text, it could be a span (already formatted)
         *  So do not perform any action
         * */
        if (!(rangeCopy.startContainer.nodeName === "#text")) {
          return null;
        }
      }

      // Check the character immediately before the track character
      const charBeforeTrackChar =
        rangeCopy.startOffset > 1
          ? rangeCopy.startContainer.textContent?.charAt(
            rangeCopy.startOffset - 2
          )
          : "";

      // If the character before the track character is not a space or doesn't exist, return null
      if (
        charBeforeTrackChar &&
        charBeforeTrackChar !== " " &&
        charBeforeTrackChar !== "\n"
      ) {
        return null;
      }

      if (
        rangeCopy.startOffset > 0 &&
        rangeCopy.startContainer.nodeName === "#text"
      ) {
        rangeCopy.setStart(rangeCopy.startContainer, rangeCopy.startOffset - 1);
        return rangeCopy.toString();
      }
    }
    return null;
  }
  /**
   * Returns true if previous character is previousCharacterToCheck or if there is just one character
   * @param {string} previousCharacterToCheck
   * @param {Range} currentRange
   * @returns  {boolean}
   */
  protected checkPreviousCharacterUsingRange(
    previousCharacterToCheck: string = " ",
    currentRange?: Range
  ) {
    if (this.inputElementReference && currentRange) {
      const rangeCopy = currentRange.cloneRange();

      if (rangeCopy.startOffset === 1) {
        return true;
      }

      if (
        rangeCopy.startOffset > 0 &&
        rangeCopy.startContainer.textContent?.charAt(
          rangeCopy.startOffset - 2
        ) !== previousCharacterToCheck
      ) {
        return false;
      }

      return true;
    }
    return false;
  }

  /**
   * Applies regex match on the input text and replaces matched instances.
   * @param {string|null} inputText - The text to apply regex match.
   * @return {string} - The replaced text.
   */
  protected onRegexMatch(inputText?: string | null, entity?: any): string {
    let replacedText = inputText ?? "";
    for (let i = 0; i < this.regexPatterns.length; i++) {
      let regexPattern = this.regexPatterns[i];

      if (inputText) {
        replacedText = inputText.replace(
          regexPattern,
          (match, capturedGroup) => {
            const span = document.createElement("span");
            span.classList.add(this.cssClassMapping[0]);
            span.setAttribute("contentEditable", "false");
            span.style.color = this.textStyle?.formattedTextColor ?? "green";
            span.style.font = this.textStyle?.formattedTextFont;
            span.textContent = match;
            span.insertAdjacentText('beforeend', "\u200B"); // Zero-width space to ensure proper spacing

            return span.outerHTML + " ";
          }
        );
      }
    }
    return replacedText;
  }

  /**
   * Debounce function.
   * @param {Function} func - The function to debounce.
   * @param {number} wait - The amount of delay before function invocation.
   * @return {Function} - The debounced function.
   */
  debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;

    return function executedFunction(...args: Object[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Handles 'keydown' events.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  onKeyUp(event: KeyboardEvent) {
    if (event.key == this.trackCharacter) {
      this.startTracking = true;
    }

    if (this.startTracking && event.key == " ") {
      this.debouncedFormatTextOnKeyUp();
    }
  }

  /**
   * Handles 'keydown' events.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  onKeyDown(event: KeyboardEvent) { }

  /**
   * Adds HTML at the current caret position.
   * @param {string} newHtml - The HTML to insert.
   * @param {Selection} currentCaretPosition - The current caret position.
   * @param {Range} currentRange - The current selection range.
   */
  protected addAtCaretPosition(
    newHtml: string,
    currentCaretPosition: Selection,
    currentRange: Range
  ) {
    if (this.inputElementReference && currentRange) {
      const selection = currentCaretPosition;
      let range = currentRange;
      range.collapse(true);

      range.setStart(range.startContainer, range.startOffset - 1);
      while (
        range.startOffset > 0 &&
        range.startContainer.textContent?.charAt(range.startOffset - 1) !==
        this.trackCharacter
      ) {
        if (
          range.startContainer.textContent?.charAt(range.startOffset - 1) == " "
        ) {
          return;
        }
        range.setStart(range.startContainer, range.startOffset - 1);
      }

      if (range.startOffset > 0) {
        range.setStart(range.startContainer, range.startOffset - 1);
        range.deleteContents();

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = newHtml;

        const fragment = document.createDocumentFragment();
        Array.from(tempDiv.childNodes).forEach((node) => {
          if (
            node instanceof Element &&
            node.classList.contains(this.cssClassMapping[0])
          ) {
            this.registerEventListeners(node, node.classList);
          }
          fragment.appendChild(node);
        });

        range.insertNode(fragment);

        range.collapse(false);

        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
    this.inputElementReference?.focus();
  }

  /**
   * Returns the original unformatted text from the input text.
   * @param {string|null|undefined} inputText - The input text to get original text from.
   * @return {string} - The original text.
   */
  getOriginalText(inputText: string | null | undefined): string {
    if (!inputText) {
      return "";
    }
    for (let i = 0; i < this.regexToReplaceFormatting.length; i++) {
      let regexPattern = this.regexToReplaceFormatting[i];

      if (inputText) {
        inputText = inputText.replace(regexPattern, "$1");
      }
    }

    return inputText;
  }

  /**
   * To inform formatter to stop keeping a track of characters
   */
  stopTracking(): void { }

  /**
   * To reset the formatter properties
   */
  reset(): void { }

  /**
   * This will be called by composer before sending the message. This can be used to set metadata, tags on message
   * @param {CometChat.BaseMessage} message
   * @return {CometChat.BaseMessage} - message with metadata added
   */
  formatMessageForSending(
    message: CometChat.BaseMessage
  ): CometChat.BaseMessage {
    return message;
  }

  /**
   * Registers event listeners on the given element.
   * @param {Element} span - The HTML element to register event listeners.
   * @param {DOMTokenList} classList - The classList of the element.
   * @return {Element} - The element with event listeners registered.
   */
  registerEventListeners(span: Element, classList: DOMTokenList): Element {
    return span;
  }
}
