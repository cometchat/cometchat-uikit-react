import React from "react";

import { CometChat } from "@cometchat-pro/chat";

import { ExtensionURLs, ExtensionConstants, localize } from "../../Shared";
import { CometChatMessageEvents } from "../";

export const Hooks = (
  props,
  stickerList,
  stickerSet,
  activeStickerSetName,
  setStickerList,
  setStickerSet,
  setActiveStickerList,
  setActiveStickerSetName,
  setDecoratorMessage
) => {
  React.useEffect(() => {
    CometChat.callExtension(
      ExtensionConstants.stickers,
      "GET",
      ExtensionURLs.stickers,
      null
    )
      .then((stickers) => {
        // Stickers received
        const customStickers = stickers.hasOwnProperty(
          ExtensionConstants.customStickers
        )
          ? stickers[ExtensionConstants.customStickers]
          : [];
        const defaultStickers = stickers.hasOwnProperty(
          ExtensionConstants.defaultStickers
        )
          ? stickers[ExtensionConstants.defaultStickers]
          : [];

        defaultStickers.sort(function (a, b) {
          return a.stickerSetOrder - b.stickerSetOrder;
        });

        customStickers.sort(function (a, b) {
          return a.stickerSetOrder - b.stickerSetOrder;
        });

        setStickerList([...defaultStickers, ...customStickers]);

        if (stickerList?.length === 0) {
          setDecoratorMessage(props.emptyText || localize("NO_STICKERS_FOUND"));
        }
      })

      .catch((error) => {
        setDecoratorMessage(props.errorText || localize("SOMETHING_WRONG"));
        CometChatMessageEvents.emit(
          CometChatMessageEvents.onMessageError,
          error
        );
      });
  }, []);

  React.useEffect(() => {
    const stickerSet = stickerList?.reduce((r, sticker, index) => {
      const { stickerSetName } = sticker;

      if (index === 0) {
        setActiveStickerSetName(stickerSetName);
      }

      r[stickerSetName] = [...(r[stickerSetName] || []), { ...sticker }];

      return r;
    }, {});
    setStickerSet(stickerSet);
  }, [stickerList]);

  React.useEffect(() => {
    if (stickerSet && Object.keys(stickerSet).length) {
      let activeStickerList = [];
      Object.keys(stickerSet).forEach((key) => {
        stickerSet[key].sort(function (a, b) {
          return a.stickerOrder - b.stickerOrder;
        });
      });
      activeStickerList = stickerSet[activeStickerSetName];
      setActiveStickerList(activeStickerList);
    }
  }, [stickerSet]);
};
