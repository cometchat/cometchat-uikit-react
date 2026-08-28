import { Action } from "./CometChatMessageComposer";
import {
  CometChat,
  Group,
  GroupMembersRequestBuilder,
  User,
  UsersRequestBuilder,
} from "@cometchat/chat-sdk-javascript";
import React, { useCallback, useEffect, useRef } from "react";
import { CometChatMentionsFormatter } from "../../formatters/CometChatFormatters/CometChatMentionsFormatter/CometChatMentionsFormatter";
import { CometChatUrlsFormatter } from "../../formatters/CometChatFormatters/CometChatUrlsFormatter/CometChatUrlsFormatter";
import { CometChatMarkdownFormatter } from "../../formatters/CometChatFormatters/CometChatMarkdownFormatter/CometChatMarkdownFormatter";
import { CometChatTextFormatter } from "../../formatters/CometChatFormatters/CometChatTextFormatter";
import { ChatConfigurator } from "../../utils/ChatConfigurator";
import { MentionsTargetElement, MessageStatus, UserMemberListType } from "../../Enums/Enums";
import { CometChatMessageEvents, IMessages } from "../../events/CometChatMessageEvents";
import { CometChatUIEvents, IMentionsCountWarning, IModal } from "../../events/CometChatUIEvents";
import { isMobileDevice } from "../../utils/util";
import { CometChatUIKitUtility } from "../../CometChatUIKit/CometChatUIKitUtility";

type Args = {
  dispatch: React.Dispatch<Action>;
  mySetAddToMsgInputText: (text: string) => void;
  errorHandler: (error: unknown, source?: string) => void;
  pasteHtmlAtCaret: (text: string) => void;
  renderSanitizedHtml: (text: string) => void;
  textFormatters: Array<CometChatTextFormatter>;
  textFormatterArray: Array<CometChatTextFormatter>;
  mentionsTextFormatterInstanceRef: React.MutableRefObject<CometChatMentionsFormatter>;
  setTextFormatters: React.Dispatch<
    React.SetStateAction<CometChatTextFormatter[]>
  >;
  CometChatUIKitLoginListener: any;
  group: CometChat.Group | undefined;
  user: CometChat.User | undefined;
  userPropRef: React.MutableRefObject<User | undefined>;
  groupPropRef: React.MutableRefObject<Group | undefined>;
  setShowListForMentions: Function;
  searchMentions: Function;
  mentionsFormatterInstanceId: string;
  setUsersRequestBuilder: React.Dispatch<
    React.SetStateAction<UsersRequestBuilder | undefined>
  >;
  setGroupMembersRequestBuilder: React.Dispatch<
    React.SetStateAction<GroupMembersRequestBuilder | undefined>
  >;
  setUserMemberListType: React.Dispatch<
    React.SetStateAction<UserMemberListType | undefined>
  >;
  textInputRef: React.MutableRefObject<any>;
  createPollViewRef: React.MutableRefObject<any>;
  setSelection: Function;
  getComposerId: Function;
  parentMessageIdPropRef: any;
  emptyInputField: Function;
  propsText: string | undefined;
  currentSelectionForRegex: React.MutableRefObject<any>;
  currentSelectionForRegexRange: React.MutableRefObject<any>
  text: string;
  getCurrentInput: Function
  isPartOfCurrentChatForUIEvent: (message: CometChat.BaseMessage) => boolean | undefined;
  textMessageToEdit:CometChat.TextMessage | null;
  getCurrentWindow: () => Window;
  getCurrentDocument: () => Document;
  onTextChange:((text: string) => void) | undefined;
  messageToReplyRef: React.MutableRefObject<CometChat.BaseMessage | null>;
  mentionsUsersRequestBuilder?: CometChat.UsersRequestBuilder;
  mentionsGroupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;

};

export function useCometChatMessageComposer(args: Args) {
  const {
    dispatch,
    mySetAddToMsgInputText,
    errorHandler,
    pasteHtmlAtCaret,
    renderSanitizedHtml,
    propsText,
    text,
    textFormatterArray,
    currentSelectionForRegex,
    currentSelectionForRegexRange,
    mentionsTextFormatterInstanceRef,
    setTextFormatters,
    textFormatters,
    emptyInputField,
    createPollViewRef,
    CometChatUIKitLoginListener,
    group,
    user,
    userPropRef,
    textInputRef,
    groupPropRef,
    setShowListForMentions,
    setSelection,
    searchMentions,
    mentionsFormatterInstanceId,
    setUsersRequestBuilder,
    setGroupMembersRequestBuilder,
    setUserMemberListType,
    getComposerId,
    isPartOfCurrentChatForUIEvent,
    parentMessageIdPropRef, getCurrentInput,textMessageToEdit,getCurrentWindow,getCurrentDocument,onTextChange,messageToReplyRef,mentionsUsersRequestBuilder,mentionsGroupMembersRequestBuilder } = args;
  const isPreviewVisible = useRef<boolean>(false);
  const autoFocusCompleted = useRef<boolean>(false);



  function handleMessageDeleted(message: CometChat.BaseMessage) {
    let user = CometChatUIKitLoginListener.getLoggedInUser();
    if (textMessageToEdit && textMessageToEdit.getId() == message.getId() && message.getSender().getUid() == user?.getUid()) {
      dispatch({ type: "setTextMessageToEdit", textMessageToEdit: null });
      dispatch({ type: "setText", text: "" });
      emptyInputField()
      mySetAddToMsgInputText("");
    }
  }

  useEffect(() => {
    const ccMessageDeleted = CometChatMessageEvents.ccMessageDeleted.subscribe((message: CometChat.BaseMessage) => {
      handleMessageDeleted(message)
    })
    const onMessageDeleted = CometChatMessageEvents.onMessageDeleted.subscribe((deletedMessage: CometChat.BaseMessage) => {
      handleMessageDeleted(deletedMessage);
    });
    return () => {
      ccMessageDeleted?.unsubscribe();
      onMessageDeleted?.unsubscribe();
    };
  }, [user, group, textMessageToEdit])

  /**
    * Subscribes to message edited UI event and handles cases 
    * when a text message is being edited, updating the input field accordingly.
    */
  useEffect(
    /**
     * Subscribes to message edited Message UI event
     */
    () => {
      try {
        const subMessageEdited = CometChatMessageEvents.ccMessageEdited.subscribe(
          (object: IMessages) => {
            let parentId = object?.message?.getParentMessageId()
            if ((parentMessageIdPropRef.current && parentId
              && parentId === parentMessageIdPropRef.current)
              || (!parentMessageIdPropRef.current && !parentId)) {
              if (isPartOfCurrentChatForUIEvent(object.message)) {
                if (
                  object.status === MessageStatus.inprogress &&
                  object.message instanceof CometChat.TextMessage
                ) {
                  isPreviewVisible.current = true;
                  dispatch({
                    type: "setMessageToReply",
                    messageToReply: null,
                  });
                  dispatch({
                    type: "setTextMessageToEdit",
                    textMessageToEdit: object.message,
                  });
                  // Decode HTML entities from the SDK text (e.g. &gt; → >)
                  // before storing in state — the SDK may return HTML-encoded text.
                  const rawDataText = object.message.getData().text;
                  const decoderDiv = getCurrentDocument()?.createElement('textarea');
                  let decodedText = rawDataText;
                  if (decoderDiv) {
                    decoderDiv.innerHTML = rawDataText;
                    decodedText = decoderDiv.value;
                  }
                  dispatch({
                    type: "setText",
                    text: decodedText,
                  });
                  emptyInputField()
                  if (renderSanitizedHtml) {
                    // Check if the contentEditable is in plaintext-only mode.
                    // If so, insert raw markdown text directly — HTML formatting
                    // would be stripped by the browser in plaintext-only mode,
                    // losing blockquote (>) and other markdown syntax.
                    const inputEl = getCurrentInput() as HTMLElement;
                    const isPlainTextOnly = inputEl?.contentEditable === 'plaintext-only';

                    if (isPlainTextOnly) {
                      // Plain text mode: process mentions through formatters
                      // then insert via innerHTML so mention spans render correctly.
                      // Note: plaintext-only restricts user input but programmatic
                      // innerHTML still works for displaying formatted mention spans.
                      if (inputEl) {
                        // Message text is untrusted and ends up in innerHTML below, so it
                        // goes through the same two steps the bubble uses: convert the tags
                        // we support, neutralise everything else. Without this a message
                        // containing "<a nice day>" was parsed as an anchor and vanished,
                        // and an "<img onerror=...>" would have run on opening the editor.
                        let finalText: string | void = CometChatUIKitUtility.sanitizeText(
                          CometChatUIKitUtility.convertSupportedHtmlToMarkdown(object.message.getText())
                        );
                        if (textFormatterArray && textFormatterArray.length) {
                          for (let i = 0; i < textFormatterArray.length; i++) {
                            if (textFormatterArray[i] instanceof CometChatMentionsFormatter) {
                              (textFormatterArray[i] as CometChatMentionsFormatter).setCometChatUserGroupMembers(object.message.getMentionedUsers());
                              if (!object.message.getDeletedAt()) {
                                const channelRegex = /<@all:(.*?)>/g;
                                const text = object.message.getText();
                                const matches = Array.from(
                                  text.matchAll(channelRegex)
                                );
                                const mentionedChannels = matches.map((m) => m[1]);
                                (textFormatterArray[i] as CometChatMentionsFormatter).setCometChatMentionedChannels(mentionedChannels);
                              }
                            }
                            if (inputEl) {
                              textFormatterArray[i].setInputElementReference(inputEl);
                            }
                            textFormatterArray[i].setCaretPositionAndRange(
                              currentSelectionForRegex.current,
                              currentSelectionForRegexRange.current
                            );
                            finalText = textFormatterArray[i].getFormattedText(
                              finalText!,
                              { mentionsTargetElement: MentionsTargetElement.textinput }
                            );
                          }
                        }
                        // Use innerHTML to preserve mention spans in the contentEditable
                        inputEl.innerHTML = finalText as string;
                        // Position cursor at end
                        const win = getCurrentWindow();
                        const browserSel = win?.getSelection();
                        if (browserSel) {
                          const newRange = getCurrentDocument()?.createRange();
                          if (newRange) {
                            newRange.selectNodeContents(inputEl);
                            newRange.collapse(false);
                            browserSel.removeAllRanges();
                            browserSel.addRange(newRange);
                          }
                        }
                      }
                    } else {
                      // Rich text mode: convert markdown to HTML and insert
                      // Ensure a valid selection/range exists inside the empty
                      // contentEditable so renderSanitizedHtml takes the primary
                      // path (sanitizeHtmlStringToFragment) instead of the plain-
                      // text fallback.
                      if (inputEl) {
                        inputEl.focus();
                        const win = getCurrentWindow();
                        const browserSel = win?.getSelection();
                        if (browserSel) {
                          const newRange = getCurrentDocument()?.createRange();
                          if (newRange) {
                            newRange.selectNodeContents(inputEl);
                            newRange.collapse(true);
                            browserSel.removeAllRanges();
                            browserSel.addRange(newRange);
                          }
                          setSelection(browserSel);
                        }
                      }
                    let finalText: string | void = object.message.getText();
                    // Apply markdown formatting first (converts **bold** → <b>, _italic_ → <i>, etc.)
                    // The textFormatterArray may not include the markdown formatter,
                    // so we apply it explicitly to ensure markdown syntax renders as HTML in the editor.
                    const hasMarkdownFormatter = textFormatterArray?.some(f => f instanceof CometChatMarkdownFormatter);
                    if (!hasMarkdownFormatter) {
                      const mdFormatter = new CometChatMarkdownFormatter();
                      finalText = mdFormatter.getFormattedText(finalText!, { mentionsTargetElement: MentionsTargetElement.textinput });
                    }
                    if (textFormatterArray && textFormatterArray.length) {
                      for (let i = 0; i < textFormatterArray.length; i++) {
                        if (textFormatterArray[i] instanceof CometChatMentionsFormatter) {
                          (textFormatterArray[i] as CometChatMentionsFormatter).setCometChatUserGroupMembers(object.message.getMentionedUsers())
                          if (!object.message.getDeletedAt()) {
                            const channelRegex = /<@all:(.*?)>/g;
                            const text = object.message.getText();
                            const matches = Array.from(
                              text.matchAll(channelRegex)
                            );
                            const mentionedChannels = matches.map((m) => m[1]);
                            
                            (textFormatterArray[i] as CometChatMentionsFormatter).setCometChatMentionedChannels(mentionedChannels);
                          }
                        }

                        const element = getCurrentInput() as HTMLElement;

                        if (element) {
                          textFormatterArray[i].setInputElementReference(element);
                        }

                        textFormatterArray[i].setCaretPositionAndRange(
                          currentSelectionForRegex.current,
                          currentSelectionForRegexRange.current
                        );
                        finalText = textFormatterArray[i].getFormattedText(
                          finalText!,
                          { mentionsTargetElement: MentionsTargetElement.textinput }

                        );
                      }
                    }
                    renderSanitizedHtml(finalText as string)
                    } // end else (rich text mode)
                  }
                }
                if ((object.status === MessageStatus.success &&
                  object.message instanceof CometChat.TextMessage) || object.status === MessageStatus.cancelled) {
                  dispatch({
                    type: "setTextMessageToEdit",
                    textMessageToEdit: null,
                  });
                  emptyInputField();
                  isPreviewVisible.current = false;
                }
                else {
                  isPreviewVisible.current = true;
                }
              }
            }
          }
        );
        const subComposeMessage = CometChatUIEvents.ccComposeMessage.subscribe(
          (text: string) => {
            dispatch({ type: "setText", text: "" });
            emptyInputField()
            pasteHtmlAtCaret(text);
            if (onTextChange) {
              onTextChange(text); // Call the onTextChange callback if provided
            }
            dispatch({ type: "setText", text: text });
          }
        );
        mentionsTextFormatterInstanceRef.current.setId(
          mentionsFormatterInstanceId
        );

        const ccShowMentionsCountWarning =
          CometChatUIEvents.ccShowMentionsCountWarning.subscribe(
            (data: IMentionsCountWarning) => {
              if (data.id === mentionsFormatterInstanceId) {
                if (data.showWarning) {
                  dispatch({
                    type: "setShowMentionsCountWarning",
                    showMentionsCountWarning: true,
                  });
                  return;
                }
                dispatch({
                  type: "setShowMentionsCountWarning",
                  showMentionsCountWarning: false,
                });
              }
            })
        return () => {
          subMessageEdited.unsubscribe();
          subComposeMessage.unsubscribe();
          ccShowMentionsCountWarning.unsubscribe();
        };
      } catch (error) {
        errorHandler(error, "useEffect")
      }
    },
    [
      mySetAddToMsgInputText,
      dispatch,
      textInputRef,
      mentionsFormatterInstanceId,
      text,
      textFormatterArray
    ]
  );

  useEffect(() => {
    const subMessageToReply = CometChatMessageEvents.ccReplyToMessage.subscribe(
      (object: IMessages) => {
        let parentId = object?.message?.getParentMessageId();
        if ((parentMessageIdPropRef.current && parentId
          && parentId === parentMessageIdPropRef.current)
          || (!parentMessageIdPropRef.current && !parentId)) {
            if (
              object.status === MessageStatus.inprogress &&
              object.message
            ) {
              dispatch({
                type: "setTextMessageToEdit",
                textMessageToEdit: null,
              });
              dispatch({
                type: "setMessageToReply",
                messageToReply: object.message,
              });
              if (pasteHtmlAtCaret) {
                const sel = getCurrentWindow()?.getSelection();
                setSelection(sel);
                pasteHtmlAtCaret('')
              }
            }
            if ((object.status === MessageStatus.success &&
              object.message) || object.status === MessageStatus.cancelled) {
              dispatch({
                type: "setMessageToReply",
                messageToReply: null,
              });
              messageToReplyRef.current = null;
              isPreviewVisible.current = false;
            }
            else {
              isPreviewVisible.current = true;
            }
          }
        }
    );
    return () => {
      subMessageToReply.unsubscribe();
    }
  },[])
  /**
  * Update text input when the conversation changes, preserving initial text from props
  */

  useEffect(() => {
    try {
      // Maintain the initial text passed from props when the conversation changes
      if (propsText && (user?.getUid() || group?.getGuid())) {
        dispatch({ type: "setAddToMsgInputText", addToMsgInputText: propsText });
      }
    } catch (error) {
      errorHandler(error, "setAddToMsgInputText")
    }
  }, [user, group, propsText, dispatch]);


  useEffect(
    /**
     * Subscribes to showModal & hideModal UI event to show & hide the Polls UI.
     */
    () => {
      try {
        const subShowModal = CometChatUIEvents.ccShowModal.subscribe(
          (data: IModal) => {
            const { composerId } = data;
            const parentMessageId = parentMessageIdPropRef?.current;
            const userId = userPropRef.current?.getUid();
            const groupId = groupPropRef.current?.getGuid();

            if (
              composerId
            ) {
              if (
                (composerId.parentMessageId && parentMessageId && composerId.parentMessageId === parentMessageId) ||
                (!parentMessageId && (composerId.user === userId || composerId.group === groupId)) ||
                (!composerId.parentMessageId && !composerId.user && !composerId.group)
              ) {
                dispatch({ type: "setShowPoll", showPoll: true });
                createPollViewRef.current = data.child;
              }

            }
            else {
              dispatch({ type: "setShowPoll", showPoll: true });
              createPollViewRef.current = data.child;
            }


          }
        );

        const subHideModal = CometChatUIEvents.ccHideModal.subscribe(() => {
          dispatch({ type: "setShowPoll", showPoll: false });
          createPollViewRef.current = null;
        });
        return () => {
          subShowModal.unsubscribe();
          subHideModal.unsubscribe();
        };
      } catch (error) {
        errorHandler(error, "ccShowModal")
      }
    },
    [createPollViewRef, dispatch]
  );
  /**
   * Setup listeners to handle selection changes and paste prevention.
   * Custom paste handling ensures text formatting integrity.
   */
  useEffect(() => {
    function triggerSelection(): void {
      try {
        let sel = getCurrentWindow()?.getSelection();
        setSelection(sel);
      } catch (error) {
        errorHandler(error, "triggerSelection")
      }
    }
    try {
      const contentEditable = getCurrentInput();
      const preventPaste = (e: ClipboardEvent) => {
        e.preventDefault();
        let clipboardData = e.clipboardData!.getData("text/plain");
        const sanitizedData = CometChatUIKitUtility.sanitizeText(clipboardData);
        if (sanitizedData) {
          pasteHtmlAtCaret(sanitizedData);
          if (onTextChange) {
            onTextChange(clipboardData);
          }
          dispatch({ type: "setText", text: clipboardData });
        }
      }

      contentEditable.addEventListener("paste", preventPaste);
      getCurrentDocument()?.addEventListener("selectionchange", triggerSelection);
      if (!isMobileDevice() && !autoFocusCompleted.current) {
        contentEditable?.focus();
        autoFocusCompleted.current = true;
      }
        if (textFormatterArray.length ) {
          let mentionsFormatter = textFormatterArray.find(
            formatter => formatter instanceof CometChatMentionsFormatter
          ) as CometChatMentionsFormatter | undefined;
          if (mentionsFormatter) {
            mentionsTextFormatterInstanceRef.current = mentionsFormatter
          }
            mentionsTextFormatterInstanceRef.current.setLoggedInUser(
              CometChatUIKitLoginListener.getLoggedInUser()
            );

            if (
              mentionsTextFormatterInstanceRef.current.getKeyDownCallBack() === undefined
            ) {
              mentionsTextFormatterInstanceRef.current.setKeyDownCallBack(searchMentions);
              mentionsTextFormatterInstanceRef.current.setKeyUpCallBack(searchMentions);
            }
            setTextFormatters(prevFormatters => {
              const newFormatter = mentionsTextFormatterInstanceRef.current;
              const hasUrlFormatter = prevFormatters.some(f => f instanceof CometChatUrlsFormatter);
              let updated = prevFormatters;
              if (!updated.includes(newFormatter)) {
                updated = [...updated, newFormatter];
              }
              if (!hasUrlFormatter) {
                const urlFormatter = ChatConfigurator.getDataSource().getUrlTextFormatter({});
                updated = [...updated, urlFormatter];
              }
              return updated === prevFormatters ? prevFormatters : updated;
            });
          
        } else {
          mentionsTextFormatterInstanceRef.current.setLoggedInUser(
            CometChatUIKitLoginListener.getLoggedInUser()
          );

          if (
            mentionsTextFormatterInstanceRef.current.getKeyDownCallBack() === undefined
          ) {
            mentionsTextFormatterInstanceRef.current.setKeyDownCallBack(searchMentions);
            mentionsTextFormatterInstanceRef.current.setKeyUpCallBack(searchMentions);
          }
          setTextFormatters(prevFormatters => {
            const newFormatter = mentionsTextFormatterInstanceRef.current;
            const hasUrlFormatter = prevFormatters.some(f => f instanceof CometChatUrlsFormatter);
            let updated = prevFormatters;
            if (!updated.includes(newFormatter)) {
              updated = [...updated, newFormatter];
            }
            if (!hasUrlFormatter) {
              const urlFormatter = ChatConfigurator.getDataSource().getUrlTextFormatter({});
              updated = [...updated, urlFormatter];
            }
            return updated === prevFormatters ? prevFormatters : updated;
          });
        }
   
      if(getCurrentWindow()?.getSelection()){
        setSelection(getCurrentWindow()?.getSelection());
      }
      return () => {
        contentEditable.removeEventListener("paste", preventPaste);
        getCurrentDocument()?.removeEventListener("selectionchange", triggerSelection);
      };
    } catch (error) {
      errorHandler(error, "preventPaste")
    }
  }, [setTextFormatters,textFormatters]);

  /**
   * Handle user or group changes and reset the composer input accordingly.
   */
  useEffect(() => {
    try {
      const shouldClearText =
        (userPropRef.current &&
          user &&
          userPropRef.current.getUid() !== user.getUid()) ||
        (groupPropRef.current &&
          group &&
          groupPropRef?.current.getGuid() !== group.getGuid());

      if (shouldClearText) {
        dispatch({ type: "setText", text: "" });
        mySetAddToMsgInputText("");
      }

      if (userPropRef.current) {
        setShowListForMentions(
          user && userPropRef.current.getUid() !== user.getUid()
        );
      }
      if (groupPropRef.current) {
        setShowListForMentions(
          group && groupPropRef?.current.getGuid() !== group.getGuid()
        );
      }
      for (let i = 0; i < textFormatterArray.length; i++) {
        textFormatterArray[i].setComposerConfig(user, group, getComposerId());
      }
    } catch (error) {
      errorHandler(error, "useEffect")
    }
  }, [
    user,
    group,
    userPropRef,
    groupPropRef,
    dispatch,
    textInputRef,
    mySetAddToMsgInputText,
  ]);

  /** 
  * Reset the message composer when a new user or group is selected.
  */
  useEffect(() => {
    try {
      if (textInputRef.current) {
        dispatch({ type: "setTextMessageToEdit", textMessageToEdit: null });
        dispatch({ type: "setText", text: "" });
        if (!isMobileDevice()) {
          emptyInputField();
        }
        else {
          let contentEditable: any = getCurrentInput();
          contentEditable.textContent = "";
        }
        mySetAddToMsgInputText("");
        isPreviewVisible.current = false;
      }
    }
    catch (error) {
      errorHandler(error, "useEffect");
    }
  }, [user, group, parentMessageIdPropRef
  ]);

  /**
    * Update text when the message composer detects pasted HTML content.
    * Handles mentions or user-group requests for the message being composed.
    */
  useEffect(() => {
    try {
      if (pasteHtmlAtCaret && propsText) {
        pasteHtmlAtCaret(propsText)
      }
        if (group) {
          const listType = UserMemberListType.groupmembers;

          setUserMemberListType(listType);

          // Use custom request builder if provided, otherwise create default one
          const requestBuilder = mentionsGroupMembersRequestBuilder || 
            new CometChat.GroupMembersRequestBuilder(group.getGuid()).setLimit(15);
          setGroupMembersRequestBuilder(requestBuilder);
        }

        if (user) {
          const listType = UserMemberListType.users;

          setUserMemberListType(listType);

          // Use custom request builder if provided, otherwise create default one
          const requestBuilder = mentionsUsersRequestBuilder || 
            new CometChat.UsersRequestBuilder().setLimit(15);
          setUsersRequestBuilder(requestBuilder);
        }
    } catch (error) {
      errorHandler(error, "useEffect")
    }
  }, [user, group, mentionsUsersRequestBuilder, mentionsGroupMembersRequestBuilder]);
}
