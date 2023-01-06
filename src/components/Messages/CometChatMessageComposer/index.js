import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import {
  CometChatActionSheet,
  CometChatSoundManager,
  CometChatLocalize,
  localize,
  CometChatPopover,
  ExtensionConstants,
  ExtensionURLs,
  CometChatTheme,
  MessageTypeConstants,
  MetadataConstants,
  ConversationOptionConstants,
} from "../..";

import {
  CometChatMessageEvents,
  CometChatCustomMessageTypes,
  getExtensionsData,
  CometChatEmojiKeyboard,
  CometChatStickerKeyboard,
  CometChatMessagePreview,
  messageConstants,
  CometChatCreatePoll,
  CometChatMessageTemplate,
  MessageComposerStyle,
} from "..";

import { getUnixTimestamp, getUniqueTimestamp } from "../CometChatMessageHelper";
import { messageStatus } from "../CometChatMessageConstants";

import { Hooks } from "./hooks";

import {
  chatComposerStyle,
  composerInputStyle,
  inputInnerStyle,
  messageInputStyle,
  stickyAttachButtonStyle,
  attchButtonIconStyle,
  inputStickyStyle,
  stickerBtnStyle,
  stickerBtnIconStyle,
  emojiButtonStyle,
  emojiBtnIconStyle,
  reactionBtnStyle,
  reactionBtnIconStyle,
  sendButtonStyle,
  sendBtnIconStyle,
  fileInputStyle,
  stickyButtonStyle,
  emojiKeyBoardStyle,
  actionSheetStyle,
  actionSheetPopoverStyle,
  stickerKeyboardStyle,
  emojiBoardPopoverStyle,
  createPollStyle,
  messagePreviewStyle,
  popoverForCreatePollStyle,
} from "./style";

import { MessagePreviewConfiguration } from "../CometChatMessagePreview/MessagePreviewConfiguration";

import { EmojiKeyboardConfiguration } from "../CometChatEmojiKeyboard/EmojiKeyboardConfiguration";

import { CreatePollConfiguration } from "../CometChatCreatePoll/CreatePollConfiguration";

import { StickerKeyboardConfiguration } from "../CometChatStickerKeyboard/StickerKeyboardConfiguration";

import roundedPlus from "./resources/add-circle-filled.svg";
import insertEmoticon from "./resources/emoji.svg";
import sendBtn from "./resources/send-message.svg";
import closeIcon from "./resources/close-circle.svg";
import heart from "./resources/heart.png";
import deleteIconURL from "./resources/delete.svg";
import { BaseStyles } from "../../Shared";

/**
 *
 * CometChatMessageComposer component part of messages component it's takes user input text,image,video etc,after pressing send button
 * it's append messages in message list, with additonal CometChat SDK conversation object.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
const CometChatMessageComposer = React.forwardRef((props, ref) => {
  const [chatWith, setChatWith] = React.useState(null);
  const [chatWithId, setChatWithId] = React.useState(null);

  const [messageInput, setMessageInput] = React.useState("");

  const [viewAttachButton, setViewAttachButton] = React.useState(false);

  const [viewSticker, setViewSticker] = React.useState(false);
  const [viewStickerTray, setViewStickerTray] = React.useState(null);

  const [viewActionSheet, setViewActionSheet] = React.useState({});
  const [actionSheetItems, setActionSheetItems] = React.useState([]);

  const [viewCreatePoll, setViewCreatePoll] = React.useState(false);
  const [viewEmojiTray, setViewEmojiTray] = React.useState({});

  const [messagePreview, setMessagePreview] = React.useState(null);

  const [viewInputField, setViewInputField] = React.useState(true);

  const stickerTemplate = React.useRef(null);
  const loggedInUser = React.useRef(null);
  let isTyping = React.useRef(null);
  let liveReactionTimeout = 0;
  const disabledState = false;
  const messageInputRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const chatRef = React.useRef(chatWith);

  const {
    user,
    group,
    style,
    theme,
    attachmentIconURL,
    stickerIconURL,
    stickerCloseIconURL,
    placeholderText,
    hideAttachment,
    liveReactionIconURL,
    hideLiveReaction,
    hideEmoji,
    emojiIconURL,
    showSendButton,
    sendButtonIconURL,
    messageTypes,
    excludeMessageTypes,
    onSendButtonClick,
    enableTypingIndicator,
    enableSoundForMessage,
    messagePreviewConfiguration,
    emojiKeyboardConfiguration,
    createPollConfiguration,
    stickerKeyboardConfiguration,
  } = props;

  const _theme = new CometChatTheme(theme ?? {});

  /**,
   * Event callbacks
   */
  React.useImperativeHandle(ref, () => ({
    previewMessageForEdit: previewMessage,
  }));

  const draftMessage = () => {};

  const previewMessage = (message) => {
    setMessagePreview({
      message: message,
      mode: ConversationOptionConstants.edit,
    });

    setMessageInput(message.text);

    const element = messageInputRef.current;
    let messageText = message.text;

    //xss extensions data
    const xssData = getExtensionsData(
      message,
      MetadataConstants.extensions.xssFilter
    );
    if (
      xssData &&
      xssData.hasOwnProperty(ExtensionConstants.sanitizedText) &&
      xssData.hasOwnProperty(ExtensionConstants.hasXSS) &&
      xssData.hasXSS === ExtensionConstants.yes
    ) {
      messageText = xssData.sanitized_text;
    }

    element.focus();
    element.textContent = "";
    pasteHtmlAtCaret(messageText, false);
  };

  const closeMessagePreview = () => {
    setMessagePreview(null);
    setMessageInput("");
    messageInputRef.current.textContent = "";
  };

  const sendMessageOnEnter = (event) => {
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      sendTextMessage();
    }
  };

  /** send text message */
  const sendTextMessage = () => {
    setViewEmojiTray(false);

    if (!messageInput.trim().length) {
      return false;
    }

    if (
      messagePreview &&
      messagePreview.mode === ConversationOptionConstants.edit
    ) {
      editMessage(messagePreview.message);
      return false;
    }

    let textMessage = new CometChat.TextMessage(
      chatWithId,
      messageInput,
      chatWith
    );

    textMessage.setSender(loggedInUser.current);
    textMessage.setReceiver(chatWith);
    textMessage.setText(messageInput);
    textMessage.setSentAt(getUnixTimestamp());
    textMessage.setMuid(String(getUniqueTimestamp()));
    CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, {
      message: textMessage,
      status: messageStatus.inprogress,
    });

    CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage);

    setMessageInput("");
    messageInputRef.current.textContent = "";

    CometChat.sendMessage(textMessage)
      .then((message) => {
        const messageObject = { ...message };
        CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, {
          message: messageObject,
          status: messageStatus.success,
        });
      })
      .catch((error) => {
        CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, {
          message: textMessage,
          error: error,
        });
      });
  };

  /** send media message */
  const sendMediaMessage = (messageInput, messageType) => {
    setViewActionSheet(false);

    let mediaMessage = new CometChat.MediaMessage(
      chatWithId,
      messageInput,
      messageType,
      chatWith
    );

    mediaMessage.setSender(loggedInUser.current);
    mediaMessage.setReceiver(chatWith);
    mediaMessage.setType(messageType);
    mediaMessage.setMetadata({
      [MetadataConstants.file]: messageInput,
    });
    mediaMessage.setSentAt(getUnixTimestamp());
    mediaMessage.setMuid(String(getUniqueTimestamp()));
    CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, {
      message: mediaMessage,
      status: messageStatus.inprogress,
    });
    CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage);

    CometChat.sendMessage(mediaMessage)
      .then((message) => {
        const messageObject = { ...message };
        CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, {
          message: messageObject,
          status: messageStatus.success,
        });
      })
      .catch((error) => {
        CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, {
          message: mediaMessage,
          error: error,
        });
      });
  };

  /** send sticker */
  const sendSticker = (stickerMessage) => {
    const customData = {
      sticker_url: stickerMessage.stickerUrl,
      sticker_name: stickerMessage.stickerName,
    };
    const customMessage = new CometChat.CustomMessage(
      chatWithId,
      chatWith,
      CometChatCustomMessageTypes.sticker,
      customData
    );

    customMessage.setSender(loggedInUser.current);
    customMessage.setReceiver(chatWith);
    customMessage.setMetadata({ incrementUnreadCount: true });
    customMessage.setSentAt(getUnixTimestamp());
    customMessage.setMuid(String(getUniqueTimestamp()));

    CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, {
      message: customMessage,
      status: messageStatus.inprogress,
    });
    CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage);

    CometChat.sendCustomMessage(customMessage)
      .then((message) => {
        const messageObject = { ...message };
        CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, {
          message: messageObject,
          status: messageStatus.success,
        });
      })
      .catch((error) => {
        CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, {
          message: customMessage,
          error: error,
        });
      });
  };

  /** edit message */
  const editMessage = (message) => {
    endTyping(null, null);

    let messageText = messageInput.trim();
    let textMessage = new CometChat.TextMessage(
      chatWithId,
      messageText,
      chatWith
    );
    textMessage.setId(messagePreview.message.id);

    setMessageInput("");
    messageInputRef.current.textContent = "";
    CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage);

    setMessagePreview(null);

    CometChat.editMessage(textMessage)
      .then((editedMessage) => {
        CometChatMessageEvents.emit(CometChatMessageEvents.onMessageEdit, {
          message: editedMessage,
          status: messageStatus.success,
        });
      })
      .catch((error) => {
        CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, {
          message: textMessage,
          error: error,
        });
      });
  };

  const startTyping = (endTypingTimeout, typingMetadata) => {
    //if typing is disabled
    if (!enableTypingIndicator) {
      return false;
    }

    //if typing is in progress
    if (isTyping.current) {
      return false;
    }

    let typingInterval = endTypingTimeout || 5000;
    let metadata = typingMetadata || undefined;

    let typingNotification = new CometChat.TypingIndicator(
      chatWithId,
      chatWith,
      metadata
    );
    CometChat.startTyping(typingNotification);

    isTyping.current = setTimeout(() => {
      endTyping(null, typingMetadata);
    }, typingInterval);
  };

  const endTyping = (event, typingMetadata) => {
    if (event) {
      event.persist();
    }

    if (!enableTypingIndicator) {
      return false;
    }

    let metadata = typingMetadata || undefined;

    let typingNotification = new CometChat.TypingIndicator(
      chatWithId,
      chatWith,
      metadata
    );
    CometChat.endTyping(typingNotification);

    clearTimeout(isTyping.current);
    isTyping.current = null;
  };

  /**
   *
   * input media message handler
   */
  const fileInputHandler = () => {
    setViewActionSheet(false);
    if (!fileInputRef.current) {
      return false;
    }
    fileInputRef.current.accept = "file/*";
    fileInputRef.current.click();
  };

  const audioInputHandler = () => {
    setViewActionSheet(false);
    if (!fileInputRef.current) {
      return false;
    }
    fileInputRef.current.accept = "audio/*";
    fileInputRef.current.click();
  };

  const imageInputHandler = () => {
    setViewActionSheet(false);
    if (!fileInputRef.current) {
      return false;
    }
    fileInputRef.current.accept = "image/*";
    fileInputRef.current.click();
  };

  const videoInputHandler = () => {
    setViewActionSheet(false);
    if (!fileInputRef.current) {
      return false;
    }
    fileInputRef.current.accept = "video/*";
    fileInputRef.current.click();
  };

  /** fileInputChangeHandler */
  const fileInputChangeHandler = (event) => {
    let selectedType = event?.currentTarget?.accept;
    selectedType = selectedType?.split("/");

    setViewActionSheet(false);

    const uploadedFile = event.target.files["0"];
    var fileNameType = uploadedFile.type.split("/");

    var reader = new FileReader();
    reader.addEventListener(
      "load",
      (event) => {
        const newFile = new File(
          [reader.result],
          uploadedFile.name,
          uploadedFile
        );

        switch (selectedType[0]) {
          case "image":
            sendMediaMessage(newFile, MessageTypeConstants.image);
            break;
          case "video":
            sendMediaMessage(newFile, MessageTypeConstants.video);
            break;
          case "audio":
            sendMediaMessage(newFile, MessageTypeConstants.audio);
            break;
          case "file":
            sendMediaMessage(newFile, MessageTypeConstants.file);
            break;
          default:
            sendMediaMessage(newFile, MessageTypeConstants.file);
            break;
        }
        fileInputRef.current.value = "";
      },
      false
    );

    reader.readAsArrayBuffer(uploadedFile);
  };

  /** closeCreatePoll */
  const closeCreatePoll = () => {
    setViewCreatePoll(false);
  };

  /** onPollSubmit */
  const onPollSubmit = () => {
    setViewCreatePoll(false);
  };

  /** openCreatePoll  */
  const openCreatePoll = () => {
    setViewActionSheet(false);
    setViewCreatePoll(true);
  };

  /** share collaborative document */
  const shareCollaborativeDocument = () => {
    setViewActionSheet(false);
    CometChat.callExtension(
      ExtensionConstants.document,
      ExtensionConstants.post,
      ExtensionURLs.document,
      {
        receiver: chatRef.current.chatWithId,
        receiverType: chatRef.current.chatWith,
      }
    ).catch((error) => {
      CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, error);
    });
  };

  /** share collaborative whitevoard */
  const shareCollaborativeWhiteboard = () => {
    setViewActionSheet(false);
    CometChat.callExtension(
      ExtensionConstants.whiteboard,
      ExtensionConstants.post,
      ExtensionURLs.whiteboard,
      {
        receiver: chatRef.current.chatWithId,
        receiverType: chatRef.current.chatWith,
      }
    ).catch((error) => {
      CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, error);
    });
  };

  /** handleInputEvent */
  const handleInputEvent = (event) => {
    startTyping();
    const elem = event.currentTarget;
    let messageInput = elem.textContent.trim();
    if (!messageInput.length) {
      event.currentTarget.textContent = messageInput;
    }
    setMessageInput(elem.innerText);
  };

  /** inputChangeHandler */
  const inputChangeHandler = (event) => {
    setTimeout(handleInputEvent(event), 500);
  };

  /** composer sticker iconClickHandler */
  const toggleStickersTray = () => {
    setViewStickerTray((prevViewStickerOption) => !prevViewStickerOption);
  };

  const pasteHtmlAtCaret = (html, selectPastedContent) => {
    var sel, range;
    const chatWindow = window;
    if (chatWindow.getSelection) {
      // IE9 and non-IE
      sel = chatWindow.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();
        // Range.createContextualFragment() would be useful here but is
        // only relatively recently standardized and is not supported in
        // some browsers (IE9, for one)
        var el = document.createElement("div");
        el.innerText = html;
        var frag = document.createDocumentFragment(),
          node,
          lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        var firstNode = frag.firstChild;
        range.insertNode(frag);
        if (lastNode) {
          range = range.cloneRange();
          range.setStartAfter(lastNode);
          if (selectPastedContent) {
            range.setStartBefore(firstNode);
          } else {
            range.collapse(true);
          }
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    } else if ((sel = document.selection) && sel.type !== "Control") {
      // IE < 9
      var originalRange = sel.createRange();
      originalRange.collapse(true);
      sel.createRange().pasteHTML(html);
      if (selectPastedContent) {
        range = sel.createRange();
        range.setEndPoint("StartToStart", originalRange);
        range.select();
      }
    }
  };

  /** select emoji from emojikeyboard */
  const onEmojiSelect = (emojiObject) => {
    const element = messageInputRef.current;
    element.focus();
    element.innerText = "";
    pasteHtmlAtCaret(messageInput + emojiObject, false);
    setMessageInput(element.innerText);
  };

  /** composer pluse button  onClickHandler */
  const attachmentClickHandler = (event) => {
    setViewActionSheet((old) => {
      return { actionSheet: !old.actionSheet, event: event };
    });
  };

  /** composer  emoji onClickHandler  */
  const emojiClickHandler = (event) => {
    setViewEmojiTray((old) => {
      return { emojiTrayPreview: !old.emojiTrayPreview, event: event };
    });
  };

  /** composer  sticker onClickHandler  */
  const stickerClickHandler = () => {
    if (stickerTemplate.current.actionCallback) {
      stickerTemplate.current.actionCallback();
    } else {
      toggleStickersTray();
    }
  };

  /** if already live reaction in progress */
  const shareLiveReaction = () => {
    if (liveReactionTimeout) {
      return false;
    }

    /** fetching the metadata type from constants */
    const data = {
      type: MetadataConstants.liveReaction,
      reaction: liveReactionIconURL || heart,
    };

    /*** send transient message */
    let transientMessage = new CometChat.TransientMessage(
      chatWithId,
      chatWith,
      data
    );
    CometChat.sendTransientMessage(transientMessage);

    /** set timeout till the next share */
    liveReactionTimeout = setTimeout(
      clearTimeout(liveReactionTimeout),
      messageConstants.liveReactionTimeout
    );

    /** emit event to share live reaction */
    const payload = {
      reaction: liveReactionIconURL || heart,
    };
    CometChatMessageEvents.emit(CometChatMessageEvents.onLiveReaction, payload);
  };

  /** attach/composr pluse icon */
  const attachOption = () => {
    return viewAttachButton ? (
      <div
        style={stickyAttachButtonStyle()}
        className="attachment__icon"
        onClick={attachmentClickHandler.bind(this)}
        title={localize("ATTACH")}
      >
        <i style={attchButtonIconStyle(style, attachmentIconURL, _theme)}></i>
      </div>
    ) : null;
  };

  /**  action sheet render under tooltip */
  const actionSheetBoard = () => {
    return viewActionSheet.actionSheet ? (
      <CometChatPopover
        position="top"
        x={viewActionSheet?.event?.clientX}
        y={viewActionSheet?.event?.clientY}
        style={actionSheetPopoverStyle(_theme)}
      >
        <CometChatActionSheet
          title={localize("ADD_TO_CHAT")}
          layoutModeIconURL={roundedPlus}
          theme={_theme}
          style={actionSheetStyle(_theme)}
          actions={actionSheetItems}
        />
      </CometChatPopover>
    ) : null;
  };

  /**CreatePollConfiguration */
  const _createPollConfiguration =
    createPollConfiguration ?? new CreatePollConfiguration({});

  const title = localize("CREATE_POLL");
  const questionPlaceholderText = localize("QUESTION");
  const answerPlaceholderText = localize("ANSWER");
  const addAnswerText = localize("ADD_ANSWER");
  const answerHelpText = localize("SET_THE_ANSWERS");

  /** createpoll */
  const createPoll = () => {
    return viewCreatePoll ? (
      <CometChatPopover
        withBackDrop={viewCreatePoll ? true : false}
        style={popoverForCreatePollStyle(_theme, _createPollConfiguration)}
      >
        <CometChatCreatePoll
          closeIconURL={_createPollConfiguration.closeIconURL || closeIcon}
          title={title}
          addAnswerIconURL={
            _createPollConfiguration.addAnswerIconURL || roundedPlus
          }
          createPollButtonText={localize("SEND")}
          deleteIconURL={
            _createPollConfiguration.deleteIconURL || deleteIconURL
          }
          defaultAnswers={2}
          theme={_theme}
          style={createPollStyle(_theme, _createPollConfiguration)}
          questionPlaceholderText={questionPlaceholderText}
          addAnswerText={addAnswerText}
          answerPlaceholderText={answerPlaceholderText}
          answerHelpText={answerHelpText}
          user={user}
          group={group}
          onClose={_createPollConfiguration.onClose || closeCreatePoll}
          onCreatePoll={_createPollConfiguration.onCreatePoll || onPollSubmit}
        />
      </CometChatPopover>
    ) : null;
  };

  /** sticker button */
  const stickerButton = () => {
    return viewSticker ? (
      <div
        title={localize("STICKER")}
        style={stickerBtnStyle()}
        className="button__sticker"
        onClick={stickerClickHandler}
      >
        <i
          style={stickerBtnIconStyle(
            style,
            viewStickerTray
              ? stickerCloseIconURL
              : stickerTemplate?.current?.icon,
            _theme
          )}
        ></i>
      </div>
    ) : null;
  };

  /** messagePreviewConfiguration */

  const _messagePreviewConfiguration =
    messagePreviewConfiguration || new MessagePreviewConfiguration({});

  /** message preview  */
  const previewTray = () => {
    return messagePreview ? (
      <CometChatMessagePreview
        messagePreviewTitle={
          _messagePreviewConfiguration.messagePreviewTitle ||
          localize("MESSAGE_EDIT")
        }
        messagePreviewSubtitle={
          _messagePreviewConfiguration.messagePreviewSubtitle ||
          messagePreview?.message?.text
        }
        closeIconURL={_messagePreviewConfiguration.closeIconURL || closeIcon}
        onCloseClick={
          _messagePreviewConfiguration.onCloseClick ||
          closeMessagePreview.bind(this)
        }
        theme={_theme}
        style={messagePreviewStyle(_theme, _messagePreviewConfiguration)}
      />
    ) : null;
  };

  /**StickerKeyboardConfiguration */
  const _stickerKeyboardConfiguration =
    stickerKeyboardConfiguration ?? new StickerKeyboardConfiguration({});

  /** sticker board */
  const stickerTray = () => {
    return viewStickerTray ? (
      <CometChatStickerKeyboard
        onClick={sendSticker.bind(this)}
        onClose={_stickerKeyboardConfiguration.onClose || toggleStickersTray}
        emptyText={localize("NO_STICKERS_FOUND")}
        errorText={localize("SOMETHING_WRONG")}
        loadingText={localize("LOADING")}
        theme={_theme}
        style={stickerKeyboardStyle(_theme, _stickerKeyboardConfiguration)}
      />
    ) : null;
  };

  /** emoji icon */
  const emojiButton = () => {
    return !hideEmoji ? (
      <div
        title={localize("EMOJI")}
        style={emojiButtonStyle()}
        className="button__emoji"
        onClick={emojiClickHandler.bind(this)}
      >
        <i style={emojiBtnIconStyle(style, emojiIconURL, _theme)}></i>
      </div>
    ) : null;
  };

  /** EmojiKeyboardConfiguration */
  const _emojiKeyboardConfiguration =
    emojiKeyboardConfiguration || new EmojiKeyboardConfiguration({});

  /** emoji board */
  const emojiBoard = () => {
    if (viewEmojiTray.emojiTrayPreview) {
      return (
        <CometChatPopover
          position="top"
          x={viewEmojiTray?.event?.clientX}
          y={viewEmojiTray?.event?.clientY}
          style={emojiBoardPopoverStyle(_theme, _emojiKeyboardConfiguration)}
        >
          <CometChatEmojiKeyboard
            theme={_theme}
            style={emojiKeyBoardStyle(_theme, _emojiKeyboardConfiguration)}
            onClick={
              _emojiKeyboardConfiguration?.onClick || onEmojiSelect.bind(this)
            }
          />
        </CometChatPopover>
      );
    } else {
      return null;
    }
  };

  /** live reaction button */
  const liveReactionButton = () => {
    if (!hideLiveReaction && !messageInputRef?.current?.innerText) {
      return (
        <div
          style={reactionBtnStyle()}
          className="button__reactions"
          onClick={shareLiveReaction.bind(this)}
        >
          <img
            src={liveReactionIconURL}
            alt={liveReactionIconURL}
            title={localize("LIVE_REACTION")}
            style={reactionBtnIconStyle()}
          />
        </div>
      );
    }
    return null;
  };

  /** send button */
  const sendButton = () => {
    return (messageInput?.length && showSendButton) || hideLiveReaction ? (
      <div
        title={localize("SEND_MESSAGE")}
        style={sendButtonStyle()}
        className="button__send"
        onClick={sendTextMessage}
      >
        <i
          style={sendBtnIconStyle(
            style,
            sendButtonIconURL,
            _theme,
            messageInput,
            isTyping
          )}
        ></i>
      </div>
    ) : null;
  };

  /**message input field*/
  const inputField = () => {
    return viewInputField ? (
      <div
        style={messageInputStyle(style, disabledState, _theme)}
        className="input__message-input"
        contentEditable="true"
        placeholder={placeholderText}
        dir={CometChatLocalize.getDir()}
        onInput={inputChangeHandler}
        onBlur={endTyping.bind(this)}
        onKeyDown={sendMessageOnEnter}
        ref={messageInputRef}
      ></div>
    ) : null;
  };

  Hooks(
    props,
    loggedInUser,
    setChatWith,
    setChatWithId,
    chatRef,
    setViewSticker,
    stickerTemplate,
    setActionSheetItems,
    setViewInputField,
    setViewAttachButton,
    openCreatePoll,
    fileInputHandler,
    videoInputHandler,
    imageInputHandler,
    audioInputHandler,
    shareCollaborativeDocument,
    shareCollaborativeWhiteboard,
    sendSticker
  );

  return (
    <div style={chatComposerStyle(style, _theme)} className="chat__composer">
      {previewTray()}
      {stickerTray()}
      {emojiBoard()}
      {actionSheetBoard()}
      <input
        type="file"
        ref={fileInputRef}
        style={fileInputStyle()}
        onChange={fileInputChangeHandler}
      />
      <div style={composerInputStyle(style)} className="composer__input">
        <div
          tabIndex="-1"
          style={inputInnerStyle(style, _theme)}
          className="input__inner"
        >
          {inputField()}

          <div
            style={inputStickyStyle(disabledState, attachOption(), _theme)}
            className="input__sticky"
          >
            {attachOption()}
            <div className="input__sticky__buttons" style={stickyButtonStyle()}>
              {stickerButton()}
              {emojiButton()}
              {liveReactionButton()}
              {sendButton()}
            </div>
          </div>
        </div>
      </div>
      {createPoll()}
    </div>
  );
});

CometChatMessageComposer.defaultProps = {
  user: null,
  group: null,
  style: {
    ...new BaseStyles({
      width: "100%",
      height: "auto",
      background: "rgb(255, 255, 255)",
      border: "1px solid rgb(234, 234, 234)",
      borderRadius: "8px",
      activeBackground: "",
    }),
    placeholderTextFont: "400 15px Inter, sans-serif",
    placeholderTextColor: "rgba(20, 20, 20,0.6)",
    attachmentIconTint: "rgba(20, 20, 20, 0.46)",
    sendButtonIconTint: "#39f",
    inputBackground: "",
    inputTextFont: "",
    inputTextColor: "",
    emojiIconTint: "rgba(20, 20, 20, 0.46)",
    stickerIconTint: "rgba(20, 20, 20, 0.46)",
    stickerCloseIconTint: "",
  },
  attachmentIconURL: roundedPlus,
  stickerCloseIconURL: "",
  placeholderText: localize("ENTER_YOUR_MESSAGE_HERE"),
  hideAttachment: false,
  liveReactionIconURL: heart,
  hideLiveReaction: false,
  hideEmoji: false,
  emojiIconURL: insertEmoticon,
  showSendButton: true,
  sendButtonIconURL: sendBtn,
  messageTypes: null,
  excludeMessageTypes: null,
  onSendButtonClick: null,
  enableTypingIndicator: true,
  enableSoundForMessage: true,
  customOutgoingMessageSound: null,
  messagePreviewConfiguration: null,
  emojiKeyboardConfiguration: null,
  stickerkeyboardConfiguration: null,
  createPollConfiguration: null,
};

CometChatMessageComposer.propTypes = {
  user: PropTypes.instanceOf(CometChat.User),
  group: PropTypes.instanceOf(CometChat.Group),
  style: PropTypes.shape(MessageComposerStyle),
  attachmentIconURL: PropTypes.string,
  stickerCloseIconURL: PropTypes.string,
  placeholderText: PropTypes.string,
  hideAttachment: PropTypes.bool,
  liveReactionIconURL: PropTypes.string,
  hideLiveReaction: PropTypes.bool,
  hideEmoji: PropTypes.bool,
  emojiIconURL: PropTypes.string,
  enableTypingIndicator: PropTypes.bool,
  enableSoundForMessage: PropTypes.bool,
  customOutgoingMessageSound: PropTypes.string,
  showSendButton: PropTypes.bool,
  sendButtonIconURL: PropTypes.string,
  onSendButtonClick: PropTypes.func,
  messageTypes: PropTypes.arrayOf(CometChatMessageTemplate),
  excludeMessageTypes: PropTypes.arrayOf(CometChatMessageTemplate),
  messagePreviewConfiguration: PropTypes.shape(MessagePreviewConfiguration),
  emojiKeyboardConfiguration: PropTypes.shape(EmojiKeyboardConfiguration),
  stickerkeyboardConfiguration: PropTypes.shape(StickerKeyboardConfiguration),
  createPollConfiguration: PropTypes.shape(CreatePollConfiguration),
};

export { CometChatMessageComposer };
