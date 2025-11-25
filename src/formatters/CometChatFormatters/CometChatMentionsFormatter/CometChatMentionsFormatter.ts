
import { CometChatTextFormatter } from "../CometChatTextFormatter";
import { MentionsTargetElement, MentionsVisibility, MessageBubbleAlignment, MouseEventSource } from "../../../Enums/Enums";
import { CometChatUIKitLoginListener } from "../../../CometChatUIKit/CometChatUIKitLoginListener";
import { CometChatUtilityConstants } from "../../../constants/CometChatUtilityConstants";
import { CometChatUIEvents } from "../../../events/CometChatUIEvents";
import { getLocalizedString } from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";

interface mentionsCssClassType {
  [key: string]: CometChat.User | CometChat.GroupMember | null;
}
interface mentionsMapType {
  [key: string]: string;
}

/**
 * Class that handles the text formatting for mentions in CometChat.
 * CometChatMentionsFormatter is a child class of CometChatTextFormatter.
 * It extends the functionality of text formatting to specifically handle user mentions
 * in the text, it keeps track of the mentions in the text, format them for display and
 * other functionalities.
 * It is used in CometChatMessageComposer component and extension decorators like link preview, message translation, text moderator.
 *
 * @extends {CometChatTextFormatter}
 */
export class CometChatMentionsFormatter extends CometChatTextFormatter {

  /**
   * List of users for mentions.
   */
  private cometChatUserGroupMembers: Array<
    CometChat.User | CometChat.GroupMember
  > = [];

  private mentionedChannels: string[] = [];

  /**
   * Mapping of CSS classes for mentions.
   */
  private mentionsCssClassMapping: mentionsCssClassType = {};

  /**
   * Specifies the visibility of mentions.
   */
  private visibleIn: MentionsVisibility = MentionsVisibility.both;

  /**
   * Regular expression for validating search input.
   *
   * The search input is considered valid if it meets all of the following conditions:
   * - It starts with an "@" symbol.
   * - After the "@" symbol, it can optionally contain alphanumeric characters or periods.
   * - If there are spaces, they should not be immediately after the "@" symbol.
   * - After a space, it can optionally contain alphanumeric characters or periods.
   *
   * If the search input does not meet these conditions, the regular expression match will fail, indicating invalid input.
   *
   * @type {RegExp}
   * @private
   */

  private invalidCharactersRegexForSearch: RegExp = /^@(?! )[a-zA-Z0-9. ]*$/;

  /**
   * Count of mentions in the text.
   */
  private mentionsCount: number = 0;

  /**
   * Map of mentions, linking user ids with their names.
   */
  private mentionsMap?: mentionsMapType = {};



  /**
   * Observer for observing changes to the text.
   */
  public observer!: MutationObserver;

  /**
   * Callback function for when a match is found by the regex used for search.
   */
  public keyUpCallBack!: Function;

  private warningDisplayed: boolean = false;

  private allowMultipleSpaces: boolean = true;

  private mouseOverEventDispatched = false;

  constructor() {
    super();
    this.regexPatterns = [/@(\w[\w\s]*)?(\b\s\w[\w\s]*)*/g];
    this.trackCharacter = "@";
    this.loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();
  }

  /**
   * Observes changes in targetNode.
   *
   * @param {HTMLElement} targetNode - The HTML element to observe for changes.
   */
  observeChange(targetNode: HTMLElement) {
    if (targetNode) {
      this.observer = new MutationObserver((mutations) => {
        if (
          this.inputElementReference &&
          this.inputElementReference!?.textContent?.trim() === ""
        ) {
          this.reset();
          this.mentionsMap = {};
          this.cssClassMapping = [];
          return;
        }
        mutations.forEach((mutation) => {
          mutation.removedNodes.forEach((node) => {
            // Check if the node is an element node
            if (node.nodeType === Node.ELEMENT_NODE) {

              let element = node as Element; // Typecast to Element
              if (
                element.tagName.toLowerCase() === "span" &&
                element.classList.contains("cometchat-mentions")
              ) {
                let mentionClass = Array.from(element.classList).find((cls) =>
                  cls.startsWith("mentions-")
                );
                if (mentionClass) {
                  let otherMentions = targetNode.querySelectorAll(
                    `.${mentionClass}`
                  );
                  if (!otherMentions.length) {
                    delete this.mentionsMap![mentionClass];
                  }
                  this.mentionsCount = Object.keys(this.mentionsMap!).length;
                  if (
                    this.mentionsCount <
                    CometChatUtilityConstants.MentionsTextFormatter
                      .MENTIONS_LIMIT
                  ) {
                    CometChatUIEvents.ccShowMentionsCountWarning.next({
                      showWarning: false,
                      id: this.getId(),
                    });
                    this.warningDisplayed = false;
                  }
                }
              }
            }
          });
        });
      });

      let config = { childList: true, subtree: true };
      this.observer.observe(targetNode as HTMLElement, config);
    }
  }

  /**
   * Retrieves the count of mentions.
   *
   * @returns {number} - The count of mentions.
   */
  getMentionsCount() {
    return this.mentionsCount;
  }

  /**
   * Sets the count of mentions.
   *
   * @param {number} mentionsCount - The count of mentions to be set.
   */
  setMentionsCount(mentionsCount: number) {
    this.mentionsCount = mentionsCount;
  }

  /**
   * Set Regex for Checking Invalid Characters in Search Term
   * @param pattern
   */
  setInvalidCharactersRegexForSearch(pattern: RegExp) {
    this.invalidCharactersRegexForSearch = pattern;
  }

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
   * Sets the reference to the input element.
   *
   * @param {HTMLElement} inputElementReference - The reference to the input element.
   */
  setInputElementReference(inputElementReference: HTMLElement) {
    this.inputElementReference = inputElementReference;
    if (!this.observer) {
      this.observeChange(inputElementReference);
    }
  }

  /**
   * Sets the regex pattern for matching text.
   *
   * @param {Array<RegExp>} regexPatterns - The array of regex patterns.
   */
  setRegexPattern(regexPatterns: Array<RegExp>) {
    this.regexPatterns = regexPatterns;
  }

  /**
   * Retrieves the CometChatUserGroupMembers.
   *
   * @returns {Array<CometChatUserGroupMembers>} - The current CometChatUserGroupMembers.
   */
  getCometChatUserGroupMembers() {
    return this.cometChatUserGroupMembers;
  }

  /**
   * Sets the CometChatUserGroupMembers.
   *
   * @param {Array<CometChatUserGroupMembers>} CometChatUserGroupMembers - The CometChatUserGroupMembers to be set.
   */
  setCometChatUserGroupMembers(
    CometChatUserGroupMembers: Array<CometChat.User | CometChat.GroupMember>
  ) {
    this.cometChatUserGroupMembers = [
      ...CometChatUserGroupMembers,
      ...this.cometChatUserGroupMembers,
    ];
  }

  resetCometChatUserGroupMembers(
  ) {
    this.cometChatUserGroupMembers = [];
  }

  /**
   * Retrieves the mentioned channels.
   * @returns {string[]} - The current mentioned channels.
   */
  getCometChatMentionedChannels() {
    return this.mentionedChannels;
  }

  /**
   * Sets the mentioned channels.
   * @param {string[]} mentionAllLabels - The mentionAll labels to be set as mentioned channels.
   */
  setCometChatMentionedChannels(mentionAllLabels: string[]) {
    this.mentionedChannels = [
      ...mentionAllLabels,
      ...this.mentionedChannels,
    ]
  }

  /**
   * Resets the mentioned channels.
   */
  resetCometChatMentionedChannels() {
    this.mentionedChannels = [];
  }

  /**
   * Sets the callback function for handling key down events.
   *
   * @param {Function} keyUpCallBack - The callback function for handling key up events.
   */
  setKeyUpCallBack(keyUpCallBack: Function) {
    this.keyUpCallBack = this.debounce(
      keyUpCallBack,
      CometChatUtilityConstants.TextFormatter.KEY_UP_DEBOUNCE_TIME
    );
  }

  /**
   * Sets the keydown callback function.
   * @param {Function} keyDownCallBack - The keydown callback function.
   */
  setKeyDownCallBack(keyDownCallBack: Function) {
    this.keyDownCallBack = this.debounce(
      keyDownCallBack,
      CometChatUtilityConstants.TextFormatter.KEY_UP_DEBOUNCE_TIME
    );
  }

  

  getAllowMultipleSpaces() {
    return this.allowMultipleSpaces;
  }

  setAllowMultipleSpaces(allowMultipleSpaces: boolean) {
    this.allowMultipleSpaces = allowMultipleSpaces;
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * This will be called by composer before sending the message. This can be used to set metadata, tags on message
   * @param {CometChat.BaseMessage} message
   * @return {CometChat.BaseMessage} - message with metadata added
   */
  formatMessageForSending(
    message: CometChat.BaseMessage
  ): CometChat.BaseMessage {
    this.resetCometChatUserGroupMembers();
    return message;
  }

  reset() {
    this.mentionsCount = 0;
    this.stopTracking();
    if (this.warningDisplayed) {
      CometChatUIEvents.ccShowMentionsCountWarning.next({
        showWarning: false,
        id: this.getId(),
      });
    }
    this.warningDisplayed = false;
  }

  stopTracking(): void {
    if (this.keyUpCallBack) {
      this.keyUpCallBack("");
    }
  }

  /**
   * Formats the input text if provided, otherwise edits the text at the cursor position.
   * @param {string} inputText - The input text to be formatted.
   * @returns {string|void} - The formatted input text, or void if inputText is not provided.
   */
  getFormattedText(
    inputText: string,
    params: { mentionsTargetElement: MentionsTargetElement } = {
      mentionsTargetElement: MentionsTargetElement.textinput,
    }
  ): string | void {
    if (params.mentionsTargetElement == MentionsTargetElement.conversation) {
    } else if (
      params.mentionsTargetElement == MentionsTargetElement.textbubble
    ) {
      let mentionedChannels: string[] = [];
      if (
        this.messageObject.getType() ===
          CometChatUIKitConstants.MessageTypes.text &&
        !this.messageObject.getDeletedAt()
      ) {
        const channelRegex = /<@all:(.*?)>/g;
        const text = (this.messageObject as any).getText() as string;
        const matches = Array.from(text.matchAll(channelRegex));
        mentionedChannels = matches.map((m) => m[1]);
        this.setCometChatMentionedChannels(mentionedChannels);
      }

      if (this.messageObject && this.messageObject.getMentionedUsers()) {
        let mentionedUsers = this.messageObject.getMentionedUsers();

        if (mentionedUsers && mentionedUsers.length) {
          this.setCometChatUserGroupMembers(mentionedUsers);
        }
        
      } else if(!mentionedChannels.length) {
        return inputText;
      }
    } else {
    }
    return this.addMentionsSpan(inputText);
  }

  getFormattedTextForEntity(entity: CometChat.User | CometChat.GroupMember | string) {
    const textToLeft = this.getPrecedingText(
      this.currentCaretPosition,
      this.currentRange
    );
    if (textToLeft) {
      let updatedText = this.onRegexMatch(textToLeft, entity);
      this.addAtCaretPosition(
        updatedText,
        this.currentCaretPosition!,
        this.currentRange!
      );
    }
    this.stopTracking()
    return;
  }

  /**
   * This function adds the mention span to the input text.
   * @param {string} inputText - The input text where the span needs to be added.
   * @returns {string} - The modified input text.
   */
  protected addMentionsSpan(inputText: string) {
    const mentionedEntities: (CometChat.User | CometChat.GroupMember | string)[] = [...this.cometChatUserGroupMembers, ...this.mentionedChannels];
    if (mentionedEntities) {
      this.warningDisplayed = false;
      for (let i = 0; i < mentionedEntities.length; i++) {
        const mentionedEntity = mentionedEntities[i];
        const isChannel = typeof mentionedEntity === 'string';
        const entityId = isChannel ? mentionedEntity : mentionedEntity.getUid();
        const entityName = isChannel
          ? getLocalizedString(`message_composer_mention_${mentionedEntity}`) || mentionedEntity
          : mentionedEntity.getName();
        const regex = new RegExp(`<${isChannel ? '@all' : '@uid'}:${entityId}>`, "g");

        const span = document.createElement("span");
        for (let i = 0; i < this.classes.length; i++) {
          span.classList.add(this.classes[i]);
        }
        span.classList.add("mentions-" + entityId);
        span.setAttribute("contentEditable", "false");

        if (!isChannel)
          this.mentionsCssClassMapping!["mentions-" + entityId] = mentionedEntity;
        
        span.classList.add("cometchat-mentions");

        if (isChannel || mentionedEntity.getUid() === this.loggedInUser!.getUid()) {
          span.classList.add("cometchat-mentions-you");
        }
        else{
          span.classList.add("cometchat-mentions-other");
        }
        
        if (this.messageBubbleAlignment === MessageBubbleAlignment.left) {
          span.classList.add("cometchat-mentions-incoming");
        } else if (this.messageBubbleAlignment === MessageBubbleAlignment.right) {
          span.classList.add("cometchat-mentions-outgoing");
        }

        const textSpan = document.createElement("span");

        textSpan.textContent = this.trackCharacter + entityName;
        textSpan.classList.add("cometchat-text");
        span.appendChild(textSpan);

        let count = 0;
        inputText = inputText.replace(regex, (match) => {
          count++;
          return span.outerHTML;
        });
        if (count) {
          this.mentionsMap!["mentions-" + entityId] = `<${isChannel ? '@all' : '@uid'}:${entityId}>`;
          this.mentionsCount = Object.keys(this.mentionsMap!).length;
          if (
            this.mentionsCount >=
            CometChatUtilityConstants.MentionsTextFormatter.MENTIONS_LIMIT &&
            !this.warningDisplayed
          ) {
            CometChatUIEvents.ccShowMentionsCountWarning.next({
              showWarning: true,
              id: this.getId(),
            });
            this.warningDisplayed = true;
          }
        }
      }
    }
    return inputText;
  }

  /**
   * Registers event listeners for click, mouseover, mouseout on the element
   * @param {HTMLElement} element - The element on which the events need to be registered
   * @param {DOMTokenList} domTokenList - The classes to be added
   * @return {HTMLElement} - The element with the registered event listeners
   */
  registerEventListeners(element: HTMLElement, domTokenList: DOMTokenList) {
    let classList: string[] = Array.from(domTokenList);
    for (let i = 0; i < classList.length; i++) {
      if (classList[i] in this.mentionsCssClassMapping!) {
        element.addEventListener("click", (event: Event) => {
          clearTimeout(this.timeoutID);
          CometChatUIEvents.ccMouseEvent.next({
            body: {
              CometChatUserGroupMembersObject:
                this.mentionsCssClassMapping[classList[i]],
              message: this.messageObject ?? null,
              id: this.getId(),
            },
            event,
            source: MouseEventSource.mentions,
          });

        });

        element.addEventListener("mouseover", (event: Event) => {
          this.timeoutID = setTimeout(() => {
            this.mouseOverEventDispatched = true;
            CometChatUIEvents.ccMouseEvent.next({
              body: {
                CometChatUserGroupMembersObject:
                  this.mentionsCssClassMapping[classList[i]],
                message: this.messageObject ?? null,
                id: this.getId(),
              },
              event,
              source: MouseEventSource.mentions,
            });

          }, CometChatUtilityConstants.MentionsTextFormatter.MENTIONS_HOVER_TIMEOUT) as unknown as number;
        });

        element.addEventListener("mouseout", (event: Event) => {
          clearTimeout(this.timeoutID);
          if (this.mouseOverEventDispatched) {
            CometChatUIEvents.ccMouseEvent.next({
              body: {
                CometChatUserGroupMembersObject:
                  this.mentionsCssClassMapping[classList[i]],
                message: this.messageObject ?? null,
                id: this.getId(),
              },
              event,
              source: MouseEventSource.mentions,
            });

            this.mouseOverEventDispatched = false;
          }
        });
      }
    }
    return element;
  }

  /**
   * Replaces mentions which are span tags with corresponding user UIDs
   *
   * @param {string | null | undefined} inputText - The text in which the mentions need to be replaced
   * @return {string} - The text after replacing the mentions with uids
   */
  protected replaceMentionsSpanWithUid(
    inputText: string | null | undefined
  ): string {
    if (!inputText) {
      return "";
    }
    Object.keys(this.mentionsMap!).forEach((spanId) => {
      const valueToReplace = this.mentionsMap![spanId];
      const spanRegex = new RegExp(
        `<span[^>]*class="[^"]*\\b${spanId}\\b[^"]*"[^>]*>.*?<\/span><\/span>`,
        "g"
      );
      inputText = inputText!.replace(spanRegex, valueToReplace);
    });
    return inputText;
  }

  /**
   * Handles the keydown events, updating the mention state as necessary
   *
   * @param {KeyboardEvent} event - The keydown event
   */
  onKeyDown(event: KeyboardEvent) {
    setTimeout(
      (event) => {
        if (event.key === "Backspace") {
          return;
        }
        if (event.key === "Escape") {
          this.mentionsCount = 0;
          this.stopTracking();
          if (this.keyDownCallBack) {
            this.keyDownCallBack("");
          }
          return;
        }

        let precedingText: string | null = "";
        precedingText = this.validateText(
          this.getPrecedingText(this.currentCaretPosition, this.currentRange)
        );

        if (
          this.mentionsCount >=
          CometChatUtilityConstants.MentionsTextFormatter.MENTIONS_LIMIT
        ) {
          if (!this.warningDisplayed) {
            CometChatUIEvents.ccShowMentionsCountWarning.next({
              showWarning: true,
              id: this.getId(),
            });

            this.warningDisplayed = true;
          }
          return;
        }

        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
            event.key
          )
        ) {
          return null;
        }

        const composerConfig = this.getComposerConfig();
        const visibility = this.getVisibleIn();

        if (visibility === MentionsVisibility.both) {
          this.keyDownCallBack(precedingText);
        } else if (visibility === MentionsVisibility.usersConversationOnly && composerConfig.user) {
          this.keyDownCallBack(precedingText);
        } else if (visibility === MentionsVisibility.groupConversationOnly && composerConfig.group) {
          this.keyDownCallBack(precedingText);
        }
      },
      0,
      event
    );
  }

  /**
   * Validates the text input based on the invalidCharactersRegexForSearch regular expression.
   *
   * @param {string | null} text - The text to validate. If null, the function will return null.
   * @returns {string | null} - Returns the original text if valid, otherwise returns null.
   */
  validateText(text: string | null): string | null {
    if (text && text.length) {
      if (!this.invalidCharactersRegexForSearch.test(text)) {
        return null;
      }

      if (!this.allowMultipleSpaces) {
        const hasMultipleSpaces = /(\s.*\s)/.test(text);
        if (hasMultipleSpaces) {
          return null;
        }
      }
    }
    return text;
  }

  /**
   * Handles the keyup events, updating the mention state as necessary
   *
   * @param {KeyboardEvent} event - The keydown event
   */
  onKeyUp(event: KeyboardEvent) {
    if (event.key === "Escape") {
      this.mentionsCount = 0;
      this.stopTracking();
      /**
       * KeyUpCallBack and keyDownCallBack are the same for mentions to ensure there is just one debounced
       * callback
       */
      if (this.keyDownCallBack) {
        this.keyDownCallBack("");
      }
      return;
    }
    let precedingText: string | null = "";
    precedingText = this.validateText(
      this.getPrecedingText(this.currentCaretPosition, this.currentRange)
    );
    if (event.key == "Backspace") {
      if (
        this.inputElementReference &&
        this.inputElementReference!?.textContent?.trim() === ""
      ) {
        this.reset();
        this.mentionsMap = {};
        this.cssClassMapping = [];
        return;
      }
    }

    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) &&
      precedingText?.includes(" ")
    ) {
      if (precedingText?.includes(" ")) {
        return null;
      }
    }

    if (
      this.mentionsCount >=
      CometChatUtilityConstants.MentionsTextFormatter.MENTIONS_LIMIT
    ) {
      return;
    }

    const composerConfig = this.getComposerConfig();
    const visibility = this.getVisibleIn();

    if (visibility === MentionsVisibility.both) {
      this.keyDownCallBack(precedingText);
    } else if (visibility === MentionsVisibility.usersConversationOnly && composerConfig.user) {
      this.keyDownCallBack(precedingText);
    } else if (visibility === MentionsVisibility.groupConversationOnly && composerConfig.group) {
      this.keyDownCallBack(precedingText);
    }
  }

  /**
   * Adds the given HTML at the caret position.
   *
   * @param {string} newHtml - The HTML to be added.
   * @param {Selection} currentCaretPosition - The current caret position
   * @param {Range} currentRange - The current range
   * @returns {void}
   */
  protected addAtCaretPosition(
    newHtml: string,
    currentCaretPosition: Selection,
    currentRange: Range
  ): void {
    if (this.inputElementReference && currentCaretPosition) {
      const selection = currentCaretPosition;
      let range = currentRange;
      range.collapse(true);

      // Move the range backward to find the '@' symbol
      while (
        range.startOffset > 0 &&
        range.startContainer.textContent?.charAt(range.startOffset - 1) !== "@"
      ) {
        range.setStart(range.startContainer, range.startOffset - 1);
      }

      if (range.startOffset > 0) {
        // Delete the '@' symbol and the content from '@' sign to the cursor position
        range.setStart(range.startContainer, range.startOffset - 1);
        range.deleteContents();

        // Create a temporary div to hold the new HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = newHtml;

        const fragment = document.createDocumentFragment();
        let lastNodeInFragment: Node;
        Array.from(tempDiv.childNodes).forEach((node) => {
          if (
            node instanceof HTMLElement &&
            node.classList.contains("mentions")
          ) {
            this.registerEventListeners(node, node.classList);
          }
          fragment.appendChild(node);
          lastNodeInFragment = node; // keep track of the last node added to the fragment
        });

        // Insert the DocumentFragment at the cursor position
        range.insertNode(fragment);

        range.collapse(false);

        // Update the selection with the modified range
        selection?.removeAllRanges();
        selection?.addRange(range);


        this.inputElementReference!.focus();
      }
    }
    this.inputElementReference!.focus();
  }

  /**
   * Matches the regex with the given inputText and replaces the matched text with respective spans of the provided entity
   *
   * @param {string} inputText - The text in which the regex patterns needs to be matched
   * @param {CometChat.User | CometChat.GroupMember | string} entity - The entity to be used for replacing the matched text
   * @return {string} - The text after replacing the matched text with spans
   */
  onRegexMatch(inputText: string, entity: CometChat.User | CometChat.GroupMember | string ): string {
    let replacedText = inputText;
    this.warningDisplayed = false;
    for (let i = 0; i < this.regexPatterns.length; i++) {
      let regexPattern = this.regexPatterns[i];

      const isEntityChannel = typeof entity === 'string';
      if (
        inputText &&
        ((!isEntityChannel && entity.getName() &&
        entity.getUid()) || isEntityChannel)
      ) {
        replacedText = inputText.replace(
          regexPattern,
          (match, capturedGroup) => {
            const alreadyMapped = this.mentionsMap![capturedGroup];

            const span = document.createElement("span");
            for (let i = 0; i < this.classes.length; i++) {
              span.classList.add(this.classes[i]);
            }
            span.classList.add(
              "mentions-" + (isEntityChannel ? entity! : entity.getUid())
            );
            span.classList.add("cometchat-mentions");
            span.setAttribute("contentEditable", "false");
            if (isEntityChannel || this.cometChatUserGroupMembers[i].getUid() === this.loggedInUser!.getUid()) {
              span.classList.add("cometchat-mentions-you");
            }
            else{
              span.classList.add("cometchat-mentions-other");
            }
            
            if (this.messageBubbleAlignment === MessageBubbleAlignment.left) {
              span.classList.add("cometchat-mentions-incoming");
            } else if (this.messageBubbleAlignment === MessageBubbleAlignment.right) {
              span.classList.add("cometchat-mentions-outgoing");
            }
            const textSpan = document.createElement("span");
            textSpan.classList.add("cometchat-text");
            if (alreadyMapped) {
              textSpan.textContent = capturedGroup;
            } else if(isEntityChannel) {
              textSpan.textContent = "@" + (getLocalizedString(`message_composer_mention_${entity}`) || entity);
              this.mentionsMap![
                "mentions-" + entity!
              ] = `<@all:${entity!}>`;
            }
            else {
              textSpan.textContent = "@" + entity.getName();
              this.mentionsMap![
                "mentions-" + entity.getUid()
              ] = `<@uid:${entity.getUid()}>`;
              this.mentionsCssClassMapping![
                "mentions-" + entity.getUid()
              ] = entity;
            }
            this.mentionsCount = Object.keys(this.mentionsMap!).length;

            if (
              this.mentionsCount >=
              CometChatUtilityConstants.MentionsTextFormatter
                .MENTIONS_LIMIT &&
              !this.warningDisplayed
            ) {
              CometChatUIEvents.ccShowMentionsCountWarning.next({
                showWarning: true,
                id: this.getId(),
              });
              this.warningDisplayed = true;
            }

            span.appendChild(textSpan);
            return span.outerHTML + " ";
          }
        );
      }
    }
    return replacedText;
  }

  /**
   * Retrieves the original text after replacing mentions span with UIDs
   *
   * @param {string | null | undefined} inputText - The input text to be formatted.
   * @returns {string} The original text after replacing mentions span with UIDs
   */
  getOriginalText(inputText: string | null | undefined): string {
    return this.replaceMentionsSpanWithUid(inputText);
  }

  setVisibleIn(visibleIn: MentionsVisibility) {
    this.visibleIn = visibleIn;
  }

  getVisibleIn() {
    return this.visibleIn;
  }
}
