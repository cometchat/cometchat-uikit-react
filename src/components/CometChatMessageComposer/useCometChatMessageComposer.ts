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
import { CometChatTextFormatter } from "../../formatters/CometChatFormatters/CometChatTextFormatter";
import { MentionsTargetElement, MessageStatus, UserMemberListType } from "../../Enums/Enums";
import { CometChatMessageEvents, IMessages } from "../../events/CometChatMessageEvents";
import { CometChatUIEvents, IMentionsCountWarning, IModal } from "../../events/CometChatUIEvents";
import { isMobileDevice } from "../../utils/util";

type Args = {
  dispatch: React.Dispatch<Action>;
  mySetAddToMsgInputText: (text: string) => void;
  errorHandler: (error: unknown, source?: string) => void;
  pasteHtmlAtCaret: (text: string) => void;
  textFormatters: Array<CometChatTextFormatter>;
  disableMentions: boolean;
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

};

export function useCometChatMessageComposer(args: Args) {
  const {
    dispatch,
    mySetAddToMsgInputText,
    errorHandler,
    pasteHtmlAtCaret,
    propsText,
    text,
    disableMentions,
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
    parentMessageIdPropRef, getCurrentInput } = args;
  const isPreviewVisible = useRef<boolean>(false);

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
                    type: "setTextMessageToEdit",
                    textMessageToEdit: object.message,
                  });
                  emptyInputField()
                  if (pasteHtmlAtCaret) {
                    const sel = window?.getSelection();
                    setSelection(sel);
                    let finalText: string | void = object.message.getText();
                    if (textFormatterArray && textFormatterArray.length) {
                      for (let i = 0; i < textFormatterArray.length; i++) {
                        if (textFormatterArray[i] instanceof CometChatMentionsFormatter && (textFormatterArray[i] as CometChatMentionsFormatter).getCometChatUserGroupMembers()?.length <= 0) {
                          (textFormatterArray[i] as CometChatMentionsFormatter).setCometChatUserGroupMembers(object.message.getMentionedUsers())
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
                    pasteHtmlAtCaret(finalText as string)
                  }
                }
                if (object.status === MessageStatus.success &&
                  object.message instanceof CometChat.TextMessage) {
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
      text
    ]
  );
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
            dispatch({ type: "setShowPoll", showPoll: true });
            createPollViewRef.current = data.child;
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
        let sel = window?.getSelection();
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
        const sanitizedData = clipboardData
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        if (sanitizedData) {
          contentEditable.removeEventListener("paste", preventPaste);
          pasteHtmlAtCaret(sanitizedData);
          dispatch({ type: "setText", text: sanitizedData });
          setTimeout(() => {
            contentEditable.addEventListener("paste", preventPaste);
          }, 0);
        }
      }

      contentEditable.addEventListener("paste", preventPaste);
      document?.addEventListener("selectionchange", triggerSelection);
      if (!isMobileDevice()) {
        contentEditable?.focus();
      }
      setSelection(window?.getSelection())
      if (!disableMentions) {
        if (textFormatterArray.length) {
          let foundMentionsFormatter = textFormatterArray.some(
            formatter => formatter instanceof CometChatMentionsFormatter
          );

          if (!foundMentionsFormatter) {
            mentionsTextFormatterInstanceRef.current.setLoggedInUser(
              CometChatUIKitLoginListener.getLoggedInUser()
            );

            if (
              mentionsTextFormatterInstanceRef.current.getKeyDownCallBack() === undefined
            ) {
              mentionsTextFormatterInstanceRef.current.setKeyDownCallBack(searchMentions);
              mentionsTextFormatterInstanceRef.current.setKeyUpCallBack(searchMentions);
            }
            setTextFormatters(prevFormatters => [
              ...prevFormatters,
              mentionsTextFormatterInstanceRef.current,
            ]);
          }
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
          setTextFormatters([
            mentionsTextFormatterInstanceRef.current,
          ]);
        }
        return () => {
          contentEditable.removeEventListener("paste", preventPaste);
          document.removeEventListener("selectionchange", triggerSelection);
        };
      }
    } catch (error) {
      errorHandler(error, "preventPaste")
    }
  }, [disableMentions, setTextFormatters, textFormatterArray]);

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
      if (!disableMentions) {
        if (group) {
          const listType = UserMemberListType.groupmembers;

          setUserMemberListType(listType);

          const requestBuilder = new CometChat.GroupMembersRequestBuilder(
            group.getGuid()
          ).setLimit(15);
          setGroupMembersRequestBuilder(requestBuilder);
        }

        if (user) {
          const listType = UserMemberListType.users;

          setUserMemberListType(listType);

          const requestBuilder = new CometChat.UsersRequestBuilder().setLimit(15);

          setUsersRequestBuilder(requestBuilder);
        }
      }
    } catch (error) {
      errorHandler(error, "useEffect")
    }
  }, [user, group, disableMentions]);
}
