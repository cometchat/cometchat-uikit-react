import React from "react";
import PropTypes from "prop-types";
import {
  CometChatDeletedMessageBubble,
  CometChatTextBubble,
  CometChatFileBubble,
  CometChatImageBubble,
  CometChatAudioBubble,
  CometChatVideoBubble,
  CometChatPollBubble,
  CometChatStickerBubble,
  CometChatDocumentBubble,
  CometChatWhiteboardBubble,
  CometChatPlaceholderBubble,
  CometChatMessageReactions,
  MessageInputData,
} from "../..";
import {
  AvatarConfiguration,
  MessageCategoryConstants,
  MessageTypeConstants,
  MessageBubbleAlignmentConstants,
  MessageTimeAlignmentConstants,
  MessageReceiptConfiguration,
  fontHelper,
  CometChatAvatar,
  CometChatMessageReceipt,
  CometChatDate,
  localize,
  CometChatMenuList,
  CometChatTheme,
  getExtensionsData,
  ExtensionConstants,
} from "../../..";

import {
  messageActionsStyle,
  messageGutterStyle,
  messageLeftGutterStyle,
  messageRightGutterStyle,
  messageAvatarStyle,
  messageSenderStyle,
  messageKitReceiptStyle,
  messageTimestampStyle,
  messageNameTimestampStyle,
  messageBlockStyle,
  messageOptionStyle,
  deleteBubbleStyle,
  reactionsStyle,
  translatedTextBlockStyle,
  translateTextStyle,
  translateLabelText,
} from "./style";

import { BaseStyles, AvatarStyles } from "../../../Shared";

import { MessageBubbleStyles } from "..";

import downloadIcon from "./resources/download-icon.svg";
import whiteBoard from "./resources/whiteboard.svg";
import documentIcon from "./resources/collaborative.svg";
import closeChat from "./resources/close-chat.svg";
import unsafeContent from "./resources/unsafe-content.svg";

import { MessageReactionsConfiguration } from "../../CometChatMessageReactions/MessageReactionsConfiguration";

import { DateConfiguration } from "../../../Shared/PrimaryComponents/CometChatConfiguration/DateConfiguration";
import { TextBubbleConfiguration } from "../CometChatTextBubble/TextBubbleConfiguration";
import { FileBubbleConfiguration } from "../CometChatFileBubble/FileBubbleConfiguration";
import { ImageBubbleConfiguration } from "../CometChatImageBubble/ImageBubbleConfiguration";
import { AudioBubbleConfiguration } from "../CometChatAudioBubble/AudioBubbleConfiguration";
import { VideoBubbleConfiguration } from "../CometChatVideoBubble/VideoBubbleConfiguration";
import { PollBubbleConfiguration } from "../CometChatPollBubble/PollBubbleConfiguration";
import { StickerBubbleConfiguration } from "../CometChatStickerBubble/StickerBubbleConfiguration";
import { DeletedBubbleConfiguration } from "../CometChatDeletedMessageBubble/DeletedBubbleConfiguration";
import { CollaborativeDocumentConfiguration } from "../CometChatDocumentBubble/CollaborativeDocumentConfiguration";

/**
 *CometChatMessageBubble handles the display and functionality for all types of messages in a message list.
 *It renders different bubbles according to the message type provided to it by the parent.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 */

const CometChatMessageBubble = (props) => {
  const {
    messageKey,
    customView,
    messageBubbleData,
    timeAlignment,
    messageOptions,
    messageObject,
    alignment,
    updateReaction,
    loggedInUser,
    style,
    theme,
    avatarConfiguration,
    messageReceiptConfiguration,
    messageReactionsConfiguration,
    dateConfiguration,
  } = props;

  const [isHovering, setIsHovering] = React.useState(null);
  const _theme = new CometChatTheme(theme || {});

  const _avatarConfiguration =
    avatarConfiguration || new AvatarConfiguration({});
  const _messageReactionsConfiguration =
    messageReactionsConfiguration || new MessageReactionsConfiguration({});

  /**
   *
   * @returns ID for each Bubble rendered
   */
  const getId = () => {
    return messageBubbleData?.id && messageObject.id ? messageObject.id : null;
  };

  /**
   *
   * @returns Avatar, if the user enabled thumbnail of messageBubbleData
   */
  const getAvatar = () => {
    const outerViewWidth = _avatarConfiguration?.outerViewWidth;
    const outerView = `${outerViewWidth} solid ${
      _theme.palette.primary[_theme.palette.mode]
    }`;
    let avatarStyle = new AvatarStyles({
      width: _avatarConfiguration?.style?.width,
      height: _avatarConfiguration?.style?.height,
      outerViewSpacing: _avatarConfiguration?.style?.outerViewSpacing,
      outerView: _avatarConfiguration?.style?.outerViewSpacing || outerView,
      textColor:
        _avatarConfiguration?.style?.textColor ||
        _theme?.palette?.accent900[_theme?.palette?.mode],
      textFont:
        _avatarConfiguration?.style?.textFont ||
        fontHelper(_theme?.typography?.name),
      border: `1px solid ${_theme?.palette?.accent600[_theme?.palette?.mode]}`,
      borderRadius: _avatarConfiguration?.style?.borderRadius,
      backgroundSize: _avatarConfiguration?.style?.backgroundSize,
      backgroundColor:
        _avatarConfiguration?.style?.backgroundColor ||
        _theme?.palette?.accent600[_theme?.palette?.mode],
    });

    // if messageObject has thumbnail key
    if (messageBubbleData?.thumbnail) {
      if (messageObject?.sender?.avatar) {
        // If Icon provided
        return (
          <div style={messageAvatarStyle()} className="message_kit__avatar">
            <CometChatAvatar
              {...avatarStyle}
              image={messageObject.sender.avatar}
            />
          </div>
        );
      } else if (messageObject?.sender?.name) {
        // show initials for name
        return (
          <div style={messageAvatarStyle()} className="message_kit__avatar">
            <CometChatAvatar
              {...avatarStyle}
              name={messageObject.sender.name}
            />
          </div>
        );
      }
    }

    return null;
  };

  /**
   *
   * @param {*} customView
   * @returns custom Bubble set by The user
   */
  const getCustomView = (customView) => {
    return React.createElement(customView, {
      key: messageObject.key,
      messageBubbleData: messageBubbleData,
      alignment: alignment,
      timeAlignment: timeAlignment,
      messageObject: messageObject,
      messageOptions: messageOptions,
      loggedInUser: loggedInUser,
      ...style,
    });
  };

  /**
   * Displays message options of a bubble when mouse is hovered on it
   */
  const getMessageOptions = () => {
    return isHovering && messageObject && !messageObject.deletedAt ? (
      <div>
        <CometChatMenuList
          isOpen={true}
          key={messageObject.id}
          data={messageObject}
          list={messageOptions}
          style={messageOptionStyle(
            alignment,
            loggedInUser,
            messageObject,
            _theme
          )}
        />
      </div>
    ) : null;
  };

  /**
   *
   * @returns Message text in a bubble of type based on the message itself
   */
  const getMessage = () => {
    /**
     * Returns a bubble based on messageObject type
     */

    if (customView) {
      return getCustomView(customView);
    } else if (messageObject.category === MessageCategoryConstants.message) {
      let messageStyle = {};

      /** emoji font according to number of emoji to be display */
      const emojiFont = (str) => {
        let strLength = str?.length;
        let fontSize = null;
        if (strLength) {
          let emojiRE = str?.match(
            /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu
          );

          let numbers = emojiRE?.length;
          if (numbers === 1 && parseInt(strLength / 2) === numbers) {
            fontSize = "32px";
          } else if (numbers === 2 && parseInt(strLength / 2) === numbers) {
            fontSize = "24px";
          } else if (numbers === 3 && parseInt(strLength / 2) === numbers) {
            fontSize = "16px";
          }
        }
        return fontSize;
      };

      switch (messageObject.type) {
        case MessageTypeConstants.text: {
          let textColor;
          if (alignment === MessageBubbleAlignmentConstants.right) {
            textColor = {
              textColor: _theme.palette.accent900["light"],
            };
          } else {
            textColor = {
              textColor: _theme.palette.accent900["dark"],
            };
          }
          messageStyle = {
            ...new BaseStyles({
              width: "",
              height: "",
              background: "transparent",
              border: "none",
              borderRadius: "12px",
              activeBackground: "",
            }),
            textFont:
              emojiFont(messageObject.text) ||
              fontHelper(_theme.typography.subtitle1),
            ...textColor,
            linkPreviewTitleFont: fontHelper(_theme.typography.title2),
            linkPreviewTitleColor: _theme.palette.accent[_theme.palette.mode],
            linkPreviewSubtitleFont: fontHelper(_theme.typography.subtitle2),
            linkPreviewSubtitleColor:
              _theme.palette.accent600[_theme.palette.mode],
            linkPreviewBackgroundColor:
              _theme.palette.background[_theme.palette.mode],
          };
          return (
            <CometChatTextBubble
              key={messageObject.id}
              messageObject={messageObject}
              overlayImageURL={unsafeContent}
              text={""}
              linkPreviewTitle={""}
              linkPreviewSubtitle={""}
              theme={_theme}
              style={messageStyle}
            />
          );
        }
        case MessageTypeConstants.image: {
          messageStyle = {
            ...new BaseStyles({
              width: "100%",
              height: "168px",
              background: "none",
              border: "none",
              borderRadius: "12px",
              activeBackground: "",
            }),
          };
          return (
            <CometChatImageBubble
              key={messageObject.id}
              messageObject={messageObject}
              style={messageStyle}
            />
          );
        }
        case MessageTypeConstants.video: {
          messageStyle = {
            ...new BaseStyles({
              width: "250px",
              height: "200px",
              background: "none",
              border: "none",
              borderRadius: "12px",
              activeBackground: "",
            }),
          };
          return (
            <CometChatVideoBubble
              key={messageObject.id}
              messageObject={messageObject}
              style={messageStyle}
            />
          );
        }
        case MessageTypeConstants.audio: {
          messageStyle = {
            ...new BaseStyles({
              width: "250px",
              height: "auto",
              background: "none",
              border: "none",
              borderRadius: "12px",
              activeBackground: "",
            }),
            iconTint: _theme.palette.primary[_theme.palette.mode],
          };
          return (
            <CometChatAudioBubble
              key={messageObject.id}
              messageObject={messageObject}
              style={messageStyle}
            />
          );
        }

        case MessageTypeConstants.file: {
          messageStyle = {
            ...new BaseStyles({
              width: "190px",
              height: "56px",
              background: "transparent",
              border: "none",
              borderRadius: "12px",
              activeBackground: "",
            }),
            titleFont: fontHelper(_theme.typography.title2),
            subTitleFont: fontHelper(_theme.typography.subtitle2),
            iconTint: _theme.palette.primary[_theme.palette.mode],
            titleColor: _theme.palette.accent[_theme.palette.mode],
            subTitleColor: _theme.palette.accent600[_theme.palette.mode],
          };
          return (
            <CometChatFileBubble
              key={messageObject.id}
              messageObject={messageObject}
              iconURL={downloadIcon}
              style={messageStyle}
              theme={_theme}
            />
          );
        }
        default:
      }
    } else if (
      props.messageObject.category === MessageCategoryConstants.custom
    ) {
      let customMessageStyle = {};
      switch (messageObject.type) {
        case MessageTypeConstants.poll: {
          if (alignment === MessageBubbleAlignmentConstants.right) {
            customMessageStyle = {
              ...new BaseStyles({
                width: "100%",
                height: "100%",
                background: "transparent",
                border: "none",
                borderRadius: "12px",
                activeBackground: "",
              }),
              votePercentTextFont: fontHelper(_theme.typography.subtitle1), //not in skecth
              votePercentTextColor:
                _theme.palette.background[_theme.palette.mode], //not in sketch
              pollQuestionTextFont: fontHelper(_theme.typography.subtitle1),
              pollQuestionTextColor: _theme.palette.accent[_theme.palette.mode],
              pollOptionTextFont: fontHelper(_theme.typography.subtitle1),
              pollOptionTextColor: _theme.palette.accent[_theme.palette.mode],
              pollOptionsBackground:
                _theme.palette.background[_theme.palette.mode],
              optionIconTint:
                style.optionsIconTint ||
                _theme.palette.accent500[_theme.palette.mode],
              totalVoteCountTextFont: fontHelper(_theme.typography.subtitle2),
              totalVoteCountTextColor:
                _theme.palette.accent600[_theme.palette.mode],
              selectedPollOptionBackground:
                style.selectedPollOptionBackground ||
                _theme.palette.primary[_theme.palette.mode],
            };
          } else {
            customMessageStyle = {
              ...new BaseStyles({
                width: "100%",
                height: "100%",
                background: "transparent",
                border: "none",
                borderRadius: "12px",
                activeBackground: "",
              }),
              background: "transparent",
              votePercentTextFont: fontHelper(_theme.typography.subtitle1),
              votePercentTextColor:
                _theme.palette.background[_theme.palette.mode],
              pollQuestionTextColor: _theme.palette.accent[_theme.palette.mode],
              pollQuestionTextFont: fontHelper(_theme.typography.subtitle1),
              pollOptionTextFont: fontHelper(_theme.typography.subtitle1),
              pollOptionTextColor: _theme.palette.accent[_theme.palette.mode],
              pollOptionsBackground:
                _theme.palette.background[_theme.palette.mode],
              totalVoteCountTextFont: fontHelper(_theme.typography.subtitle2),
              totalVoteCountTextColor:
                _theme.palette.accent600[_theme.palette.mode],
              optionIconTint:
                style.optionsIconTint ||
                _theme.palette.accent500[_theme.palette.mode],
              pollOptionBorder: "none",
              selectedPollOptionBackground:
                style.selectedPollOptionBackground ||
                _theme.palette.primary[_theme.palette.mode],
            };
          }
          return (
            <CometChatPollBubble
              key={messageObject.id}
              messageObject={messageObject}
              pollQuestion={""}
              options={null}
              totalVoteCount={null}
              optionIconURL={null}
              loggedInUser={loggedInUser || loggedInUser}
              theme={_theme}
              style={customMessageStyle}
            />
          );
        }
        case MessageTypeConstants.sticker: {
          if (
            alignment === MessageBubbleAlignmentConstants.right ||
            alignment === MessageBubbleAlignmentConstants.left
          ) {
            customMessageStyle = {
              ...new BaseStyles({
                width: "150px",
                height: "auto",
                background: "transparent",
                border: "none",
                borderRadius: "12px",
                activeBackground: "",
              }),
            };
          }
          return (
            <CometChatStickerBubble
              key={messageKey}
              messageObject={messageObject}
              style={customMessageStyle}
            />
          );
        }
        case MessageTypeConstants.whiteboard: {
          if (alignment === MessageBubbleAlignmentConstants.right) {
            customMessageStyle = {
              ...new BaseStyles({
                width: "228px",
                height: "134px",
                background: "transparent",
                border: "none",
                borderRadius: "12px",
                activeBackground: "",
              }),
              titleFont: fontHelper(_theme.typography.title2),
              iconTint: _theme.palette.accent700[_theme.palette.mode],
              titleColor: _theme.palette.accent[_theme.palette.mode],
              subTitleColor: _theme.palette.accent600[_theme.palette.mode],
              subTitleFont: fontHelper(_theme.typography.subtitle2),
              buttonTextColor: _theme.palette.primary[_theme.palette.mode],
              buttonTextFont: fontHelper(_theme.typography.title2),
              buttonBackground: "transparent",
            };
          } else {
            customMessageStyle = {
              ...new BaseStyles({
                width: "228px",
                height: "134px",
                background: "transparent",
                border: "none",
                borderRadius: "12px",
                activeBackground: "",
              }),
              titleFont: fontHelper(_theme.typography.title2),
              iconTint: _theme.palette.accent700[_theme.palette.mode],
              titleColor: _theme.palette.accent[_theme.palette.mode],
              subTitleColor: _theme.palette.accent600[_theme.palette.mode],
              subTitleFont: fontHelper(_theme.typography.subtitle2),
              buttonTextColor: _theme.palette.primary[_theme.palette.mode],
              buttonTextFont: fontHelper(_theme.typography.title2),
              buttonBackground: "transparent",
            };
          }
          return (
            <CometChatWhiteboardBubble
              whiteboardURL={""}
              key={messageKey}
              messageObject={messageObject}
              subTitle={localize("WHITEBOARD_SUBTITLE_MESSAGE")}
              iconURL={whiteBoard}
              title={localize("SHARED_COLLABORATIVE_WHITEBOARD")}
              buttonText={localize("OPEN_WHITEBOARD")}
              theme={_theme}
              style={customMessageStyle}
            />
          );
        }
        case MessageTypeConstants.document: {
          if (alignment === MessageBubbleAlignmentConstants.right) {
            customMessageStyle = {
              ...new BaseStyles({
                width: "228px",
                height: "134px",
                background: "transparent",
                border: "none",
                borderRadius: "12px",
                activeBackground: "",
              }),
              titleFont: fontHelper(_theme.typography.title2),
              iconTint: _theme.palette.accent700[_theme.palette.mode],
              titleColor: _theme.palette.accent[_theme.palette.mode],
              subTitleColor: _theme.palette.accent600[_theme.palette.mode],
              subTitleFont: fontHelper(_theme.typography.subtitle2),
              buttonTextColor: _theme.palette.primary[_theme.palette.mode],
              buttonTextFont: fontHelper(_theme.typography.title2),
              buttonBackground: "transparent",
            };
          } else {
            customMessageStyle = {
              ...new BaseStyles({
                width: "228px",
                height: "134px",
                background: "transparent",
                border: "none",
                borderRadius: "12px",
                activeBackground: "",
              }),
              titleFont: fontHelper(_theme.typography.title2),
              iconTint: _theme.palette.accent700[_theme.palette.mode],
              titleColor: _theme.palette.accent[_theme.palette.mode],
              subTitleColor: _theme.palette.accent600[_theme.palette.mode],
              subTitleFont: fontHelper(_theme.typography.subtitle2),
              buttonTextColor: _theme.palette.primary[_theme.palette.mode],
              buttonTextFont: fontHelper(_theme.typography.title2),
              buttonBackground: "transparent",
            };
          }
          return (
            <CometChatDocumentBubble
              key={messageKey}
              messageObject={messageObject}
              iconURL={documentIcon}
              title={localize("SHARED_COLLABORATIVE_DOCUMENT")}
              subTitle={localize("DOCUMENT_SUBTITLE_MESSAGE")}
              buttonText={localize("OPEN_DOCUMENT")}
              theme={_theme}
              style={customMessageStyle}
            />
          );
        }
        default: {
          if (alignment === MessageBubbleAlignmentConstants.right) {
            customMessageStyle = {
              ...new BaseStyles({
                width: "auto",
                height: "auto",
                background: "transparent",
                border: "none",
                borderRadius: "12px",
                activeBackground: "",
              }),
              textColor: _theme.palette.primary[_theme.palette.mode],
              textFont: fontHelper(_theme.typography.subtitle1),
            };
          } else {
            customMessageStyle = {
              ...new BaseStyles({
                width: "auto",
                height: "auto",
                background: "transparent",
                border: "none",
                borderRadius: "12px",
                activeBackground: "",
              }),
              textColor: _theme.palette.accent[_theme.palette.mode],
              textFont: fontHelper(_theme.typography.subtitle1),
            };
          }
          return (
            <CometChatPlaceholderBubble
              key={messageKey}
              style={customMessageStyle}
              text={messageObject.type + "message is not supported"}
            />
          );
        }
      }
    }
  };

  /**
   * Returns delete bubble view if a message is deleted
   */
  const getDeleteBubble = () => {
    return (
      <CometChatDeletedMessageBubble
        text={localize("MESSAGE_IS_DELETED")}
        style={deleteBubbleStyle(_theme)}
      />
    );
  };

  /**
   *
   * @returns Reactions on a message
   */
  const messageReactions = () => {
    let reactionsData = getExtensionsData(
      messageObject,
      ExtensionConstants.reactions
    );
    if (reactionsData && Object.keys(reactionsData).length) {
      return (
        <CometChatMessageReactions
          messageObject={messageObject}
          loggedInUser={loggedInUser}
          addReactionIconURL={_messageReactionsConfiguration.addReactionIconURL}
          style={reactionsStyle(_theme, alignment, messageObject)}
          updateReaction={updateReaction}
        />
      );
    }

    return null;
  };

  /**
   *
   * @returns translated text on using text translate
   */
  const getTranslatedMessage = () => {
    if (messageObject?.metadata?.translatedText) {
      return (
        <div
          className="message_translate__block"
          style={translatedTextBlockStyle(alignment, _theme)}
        >
          <p className="message_translate__text" style={translateTextStyle()}>
            {messageObject.metadata.translatedText}
          </p>
          <p
            className="message_translate__label"
            style={translateLabelText(alignment, _theme)}
          >
            {localize("TRANSLATED_MESSAGE")}
          </p>
        </div>
      );
    }
  };

  /**
   * Displays a component when Mouse Hovers on a bubble
   */
  const showMessageOptions = () => {
    if (!isHovering) {
      setIsHovering(true);
    }
  };

  /**
   * Hides the component when Mouse doesn't hover anymore on the bubble
   */
  const hideMessageOptions = () => {
    if (isHovering) {
      setIsHovering(false);
    }
  };

  /**
   *
   * @returns name of the sender
   */
  const getSenderName = () => {
    return messageBubbleData?.title && messageObject?.sender?.name ? (
      <span
        style={messageSenderStyle(style, _theme)}
        className="message_kit__sender"
      >
        {messageObject.sender.name}
      </span>
    ) : null;
  };

  /**
   *
   * @returns time of message sent
   */
  const getMessageTime = () => {
    const _dateConfiguration = dateConfiguration || new DateConfiguration({});
    return messageBubbleData?.timestamp && messageObject?.sentAt ? (
      <div
        style={messageTimestampStyle(style, _theme)}
        className="message_kit__time_bar"
      >
        <CometChatDate
          timestamp={messageObject.sentAt || _dateConfiguration.timeStamp}
          pattern={"timeFormat" || _dateConfiguration.pattern}
          style={{
            textFont:
              style.timestampFont || fontHelper(_theme.typography.caption1),
            textColor:
              style.timestampColor ||
              _theme.palette.accent[_theme.palette.mode],
          }}
        />
      </div>
    ) : null;
  };

  const getMessageReceipt = () => {
    const _messageReceiptConfiguration =
      messageReceiptConfiguration || new MessageReceiptConfiguration({});

    return messageBubbleData?.readReceipt ? (
      <CometChatMessageReceipt
        messageObject={messageObject}
        loggedInUser={loggedInUser}
        messageDeliveredIcon={_messageReceiptConfiguration.messageDeliveredIcon}
        messageErrorIcon={_messageReceiptConfiguration.messageErrorIcon}
        messageSentIcon={_messageReceiptConfiguration.messageSentIcon}
        messageWaitIcon={_messageReceiptConfiguration.messageWaitIcon}
        messageReadIcon={_messageReceiptConfiguration.messageReadIcon}
      />
    ) : null;
  };

  const getLeftView = () => {
    //if the message bubble is aligned to the left

    if (alignment === MessageBubbleAlignmentConstants.left) {
      return messageBubbleData?.thumbnail ? (
        <div
          style={messageLeftGutterStyle()}
          className="message_kit__gutter__left"
        >
          {getAvatar()}
        </div>
      ) : null;

      //if the message bubble is aligned to the right
    } else {
      let topBar = null;
      let bottomBar = null;

      //if loggedin user is the sender
      if (loggedInUser?.uid === messageObject?.sender?.uid) {
        //if timestamp is to be shown on the top of the message bubble i.e. similar to slack
        if (timeAlignment.toLowerCase() === MessageTimeAlignmentConstants.top) {
          topBar =
            messageBubbleData.timestamp || messageBubbleData.title ? (
              <div
                style={messageSenderStyle(style, _theme)}
                className="message_kit__username_bar"
              >
                {getMessageTime()}&nbsp;{getSenderName()}
              </div>
            ) : null;

          bottomBar = messageBubbleData?.readReceipt ? (
            <div
              style={messageKitReceiptStyle()}
              className="message_kit__receipt_bar"
            >
              {getMessageReceipt()}
            </div>
          ) : null;
        } else if (
          timeAlignment.toLowerCase() === MessageTimeAlignmentConstants.bottom
        ) {
          topBar = messageBubbleData?.title ? (
            <div
              style={messageSenderStyle(style, _theme)}
              className="message_kit__username_bar"
            >
              {getSenderName()}
            </div>
          ) : null;

          bottomBar =
            messageBubbleData?.timestamp || messageBubbleData?.readReceipt ? (
              <div
                style={messageKitReceiptStyle()}
                className="message_kit__receipt_bar"
              >
                {getMessageTime()}&nbsp;{getMessageReceipt()}
              </div>
            ) : null;
        }
      }
      return (
        <div
          style={messageLeftGutterStyle()}
          className="message_kit__gutter__left"
        >
          {topBar}
          <div
            data-id={getId()}
            className="message_kit__hover"
            onMouseEnter={showMessageOptions}
            onMouseLeave={hideMessageOptions}
          >
            <div
              style={messageBlockStyle(alignment, style, messageObject, _theme)}
              className="messageBlockStyle"
            >
              {messageObject && messageObject.deletedAt ? (
                getDeleteBubble()
              ) : (
                <React.Fragment>
                  {getMessageOptions()}
                  {getMessage()}
                  {getTranslatedMessage()}
                  {messageReactions()}
                </React.Fragment>
              )}
            </div>
          </div>
          {bottomBar}
        </div>
      );
    }
  };

  const getRightview = () => {
    //if the message bubble is aligned to left
    if (alignment === MessageBubbleAlignmentConstants.left) {
      let topBar = getSenderName();
      let bottomBar = null;

      //if timestamp is to be shown on the top of the message bubble i.e. similar to slack
      if (timeAlignment.toLowerCase() === MessageTimeAlignmentConstants.top) {
        topBar =
          messageBubbleData.title || messageBubbleData.timestamp ? (
            <div
              style={messageNameTimestampStyle()}
              className="message_kit__username_bar"
            >
              {getSenderName()}&nbsp;{getMessageTime()}
            </div>
          ) : null;

        //if loggedin user is the sender of the message
        if (
          loggedInUser?.uid === messageObject?.sender?.uid &&
          messageBubbleData?.readReceipt
        ) {
          bottomBar = (
            <div
              style={messageKitReceiptStyle()}
              className="message_kit__receipt_bar"
            >
              {getMessageReceipt()}
            </div>
          );
        }

        //if timestamp is to be shown at the bottom of the message bubble i.e. similar to slack
      } else if (
        timeAlignment.toLowerCase() === MessageTimeAlignmentConstants.bottom
      ) {
        //if loggedin user is the sender of the message
        if (loggedInUser?.uid === messageObject?.sender?.uid) {
          bottomBar =
            messageBubbleData.timestamp || messageBubbleData.readReceipt ? (
              <div
                style={messageKitReceiptStyle()}
                className="message_kit__receipt_bar"
              >
                {getMessageTime()}&nbsp;{getMessageReceipt()}
              </div>
            ) : null;
        } else {
          bottomBar = (
            <div
              style={messageKitReceiptStyle()}
              className="message_kit__receipt_bar"
            >
              {getMessageTime()}
            </div>
          );
        }
      }

      return (
        <div
          style={messageRightGutterStyle()}
          className="message_kit__gutter__right"
        >
          {topBar}
          <div
            data-id={getId()}
            className="message_kit__hover"
            onMouseEnter={showMessageOptions}
            onMouseLeave={hideMessageOptions}
          >
            <div
              style={messageBlockStyle(alignment, style, messageObject, _theme)}
              className="messageBlockStyle"
            >
              {messageObject?.deletedAt ? (
                getDeleteBubble()
              ) : (
                <React.Fragment>
                  {getMessageOptions()}
                  {getMessage()}
                  {getTranslatedMessage()}
                  {messageReactions()}
                </React.Fragment>
              )}
            </div>
          </div>
          {bottomBar}
        </div>
      );
    } else {
      //if loggedin user is the sender of the message
      if (loggedInUser?.uid === messageObject?.sender?.uid) {
        return messageBubbleData?.thumbnail ? (
          <div
            style={messageLeftGutterStyle()}
            className="message_kit__gutter__right"
          >
            {getAvatar()}
          </div>
        ) : null;
      }
    }
  };

  return (
    <div
      style={messageActionsStyle(props, _theme)}
      className="message_kit__actions"
    >
      <div style={messageGutterStyle()} className="c-message_kit__gutter">
        {getLeftView()}
        {getRightview()}
      </div>
    </div>
  );
};

CometChatMessageBubble.defaultProps = {
  messageBubbleData: {
    id: true,
    thumbnail: true,
    title: false,
    timestamp: true,
    readReceipt: true,
  },
  timeAlignment: "bottom",
  messageOptions: [],
  messageObject: null,
  alignment: "standard",
  loggedInUser: null,
  style: {
    width: "",
    height: "",
    nameTextFont: "",
    nameTextColor: "",
    border: "",
    background: "",
    borderRadius: "",
    timestampFont: "",
    timestampColor: "",
  },
};

CometChatMessageBubble.propTypes = {
  messageBubbleData: PropTypes.object,
  timeAlignment: PropTypes.string,
  messageOptions: PropTypes.array,
  messageObject: PropTypes.object,
  alignment: PropTypes.string,
  loggedInUser: PropTypes.object,
  style: PropTypes.object,
  avatarConfiguration: PropTypes.object,
  messageReceiptConfiguration: PropTypes.object,
  messageReactionsConfiguration: PropTypes.object,
  dateConfiguration: PropTypes.object,
  textBubbleConfiguration: PropTypes.object,
  fileBubbleConfiguration: PropTypes.object,
  imageBubbleConfiguration: PropTypes.object,
  audioBubbleConfiguration: PropTypes.object,
  videoBubbleConfiguration: PropTypes.object,
  pollBubbleConfiguration: PropTypes.object,
  stickerBubbleConfiguration: PropTypes.object,
  deletedBubbleConfiguration: PropTypes.object,
  collaborativeWhiteboardConfiguration: PropTypes.object,
  collaborativeDocumentConfiguration: PropTypes.object,
};

export { CometChatMessageBubble };
