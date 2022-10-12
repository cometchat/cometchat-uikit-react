import React from "react";

import PropTypes from "prop-types";

import { CometChatTheme, ExtensionConstants, localize } from "../../Shared";

import { Hooks } from "./hooks";

import {
  stickerWrapperStyle,
  stickerSectionListStyle,
  stickerListStyle,
  sectionListItemStyle,
  stickerItemStyle,
  stickerMsgStyle,
  stickerMsgTxtStyle,
  stickerImageStyle,
  stickerCategoryImageStyle,
} from "./style";

/**
 *
 * CometChatStickerKeyboard is a component that fetches stickers from Stickers extension
 * and displays it.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */

const CometChatStickerKeyboard = (props) => {
  const [stickerList, setStickerList] = React.useState([]);
  const [stickerSet, setStickerSet] = React.useState(null);
  const [activeStickerList, setActiveStickerList] = React.useState([]);
  const [activeStickerSetName, setActiveStickerSetName] = React.useState();
  const [decoratorMessage, setDecoratorMessage] = React.useState(
    props.loadingText || localize("LOADING")
  );

  const theme = new CometChatTheme(props.theme || {});
  const sendStickerMessage = (stickerItem) => {
    props.onClick(stickerItem);
  };

  const onStickerSetClicked = (sectionItem) => {
    setActiveStickerList(stickerSet[sectionItem]);
    setActiveStickerSetName(sectionItem);
  };

  const getStickerList = () => {
    let activeStickers = [];
    if (activeStickerList && activeStickerList?.length) {
      const stickerList = [...activeStickerList];
      activeStickers = stickerList.map((stickerItem, key) => {
        return (
          <div
            key={key}
            style={stickerItemStyle(props)}
            onClick={sendStickerMessage.bind(this, stickerItem)}
            className="stickers__listitem"
          >
            <img
              src={stickerItem.stickerUrl}
              alt={stickerItem.stickerName}
              style={stickerImageStyle()}
            />
          </div>
        );
      });
    }
    return activeStickers;
  };

  const getStickerCategory = () => {
    let sectionItems = null;
    if (stickerSet && Object.keys(stickerSet).length) {
      sectionItems = Object.keys(stickerSet).map((sectionItem, key) => {
        const stickerSetThumbnail =
          stickerSet[sectionItem][0][ExtensionConstants.stickerUrl];
        return (
          <div
            key={key}
            className="stickers__category__item"
            style={sectionListItemStyle()}
            onClick={onStickerSetClicked.bind(this, sectionItem)}
          >
            <img
              src={stickerSetThumbnail}
              alt={sectionItem}
              title={stickerSet[sectionItem][0]["stickerSetName"]}
              style={stickerCategoryImageStyle()}
            />
          </div>
        );
      });
    }
    return sectionItems;
  };

  const getDecoratorMessage = () => {
    let messageContainer = null;
    if (activeStickerList?.length === 0) {
      messageContainer = (
        <div style={stickerMsgStyle()} className="stickers__decorator-message">
          <p
            style={stickerMsgTxtStyle(props, theme)}
            className="decorator_message"
          >
            {decoratorMessage}
          </p>
        </div>
      );
    }
    return messageContainer;
  };

  Hooks(
    props,
    stickerList,
    stickerSet,
    activeStickerSetName,
    setStickerList,
    setStickerSet,
    setActiveStickerList,
    setActiveStickerSetName,
    setDecoratorMessage
  );

  return (
    <div
      style={stickerWrapperStyle(props, theme)}
      className="stickers__keyboard"
    >
      {getDecoratorMessage()}
      <div style={stickerListStyle(props)} className="stickers__list">
        {getStickerList()}
      </div>
      <div
        style={stickerSectionListStyle(props, theme)}
        className="stickers__category"
      >
        {getStickerCategory()}
      </div>
    </div>
  );
};

// Specifies the default values for props:
CometChatStickerKeyboard.defaultProps = {
  emptyText: localize("NO_STICKERS_FOUND"),
  errorText: localize("SOMETHING_WRONG"),
  loadingText: localize("LOADING"),
  style: {
    width: "100%",
    height: "auto",
    border: "none",
    background: "RGB(245, 245, 245)",
    borderRadius: "8px",
    categoryBackground: "rgb(255,255,255)",
    emptyTextFont: "500 15px Inter,sans-serif",
    emptyTextColor: "rgba(20,20,20, 0.58)",
    errorTextFont: "500 15px Inter,sans-serif",
    errorTextColor: "rgba(20,20,20, 0.58)",
    loadingTextFont: "500 15px Inter,sans-serif",
    loadingTextColor: "rgba(20,20,20, 0.58)",
  },
  onClick: () => {},
};

CometChatStickerKeyboard.propTypes = {
  emptyText: PropTypes.string,
  errorText: PropTypes.string,
  loadingText: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func,
};

export { CometChatStickerKeyboard };
