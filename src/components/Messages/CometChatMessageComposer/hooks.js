import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { MessageTypeConstants, ReceiverTypeConstants } from "../..";

import { getDefaultTypes } from "../CometChatMessageTemplate";

import { CometChatMessageTypes, CometChatCustomMessageTypes } from "..";

export const Hooks = (
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
) => {
  const helper = (type, item) => {
    switch (type) {
      case CometChatMessageTypes.file:
        return { ...item, onActionClick: fileInputHandler };
      case CometChatMessageTypes.image:
        return { ...item, onActionClick: imageInputHandler };
      case CometChatMessageTypes.audio:
        return { ...item, onActionClick: audioInputHandler };
      case CometChatMessageTypes.video:
        return { ...item, onActionClick: videoInputHandler };
      case CometChatCustomMessageTypes.poll: {
        return { ...item, onActionClick: openCreatePoll };
      }
      case CometChatCustomMessageTypes.document: {
        return { ...item, onActionClick: shareCollaborativeDocument };
      }
      case CometChatCustomMessageTypes.whiteboard: {
        return { ...item, onActionClick: shareCollaborativeWhiteboard };
      }
      case CometChatCustomMessageTypes.sticker: {
        return { ...item, onActionClick: sendSticker };
      }
      default:
        break;
    }
  };

  //fetch logged in user
  React.useEffect(() => {
    CometChat.getLoggedinUser().then((user) => (loggedInUser.current = user));
  }, []);

  React.useEffect(() => {
    //update receiver user
    if (props.user && props.user.uid) {
      chatRef.current = {
        chatWith: ReceiverTypeConstants.user,
        chatWithId: props.user.uid,
      };

      setChatWith(ReceiverTypeConstants.user);
      setChatWithId(props.user.uid);
    } else if (props.group && props.group.guid) {
      chatRef.current = {
        chatWith: ReceiverTypeConstants.group,
        chatWithId: props.group.guid,
      };

      setChatWith(ReceiverTypeConstants.group);
      setChatWithId(props.group.guid);
    }
  }, [props.user, props.group, setChatWith, setChatWithId, chatRef]);

  React.useEffect(() => {
    let stickerMessageTemplate = null;
    let textMessageTemplate = null;
    let actionItems = [];
    if (props.messageTypes && props.messageTypes.length) {
      let Items = props.messageTypes.map((item, index) => {
        if (item.onActionClick === null) {
          return helper(item.type, item);
        }
        return item;
      });

      if (props?.excludeMessageTypes) {
        Items = Items?.filter(
          (val) => !props?.excludeMessageTypes?.includes(val?.type)
        );
      }

      actionItems = Items.filter((item, index) => {
        if (
          item?.type !== MessageTypeConstants.text &&
          item?.type !== MessageTypeConstants.sticker
        ) {
          return item;
        }
      });
      textMessageTemplate = props.messageTypes.find(
        (messageTemplate) => messageTemplate.type === MessageTypeConstants.text
      );
      stickerMessageTemplate = props.messageTypes.find(
        (messageTemplate) =>
          messageTemplate.type === MessageTypeConstants.sticker
      );
    } else {
      let defaultTypes = getDefaultTypes();
      let Items = defaultTypes.map((item, index) => {
        if (item.onActionClick === null) {
          return helper(item.type, item);
        }
        return item;
      });

      Items = Items?.filter(
        (val) => !props?.excludeMessageTypes?.includes(val?.type)
      );

      actionItems = Items?.filter((item, index) => {
        if (
          item?.type !== MessageTypeConstants.text &&
          item?.type !== MessageTypeConstants.sticker
        ) {
          return item;
        }
      });
      textMessageTemplate = defaultTypes?.find(
        (messageTemplate) => messageTemplate?.type === MessageTypeConstants.text
      );
      stickerMessageTemplate = defaultTypes?.find(
        (messageTemplate) =>
          messageTemplate?.type === MessageTypeConstants.sticker
      );
    }

    //if messageTypes is't contain text, hide message input box.
    if (textMessageTemplate) {
      setViewInputField(true);
    } else {
      setViewInputField(false);
    }

    //if messageTypes is't contain sticker, hide sticker.
    if (stickerMessageTemplate) {
      setViewSticker(true);
      stickerTemplate.current = stickerMessageTemplate;
    } else {
      setViewSticker(false);
      stickerTemplate.current = null;
    }

    //if message filters are set, show attachment button
    if (actionItems.length && !props.hideAttachment) {
      setViewAttachButton(true);
      setActionSheetItems(actionItems);
    }
  }, [props.messageTypes, props.excludeMessageTypes]);
};
