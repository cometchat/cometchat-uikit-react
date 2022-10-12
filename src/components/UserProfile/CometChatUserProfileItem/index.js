import { useEffect, useState, useCallback } from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";
import { localize } from "../..";

import { CometChatAvatar, CometChatStatusIndicator } from "../../Shared";

import {
  detailStyle,
  thumbnailStyle,
  userDetailStyle,
  userNameStyle,
  userStatusStyle,
} from "./style";

const CometChatUserProfileItem = (props) => {
  return (
    <div css={detailStyle()} className="userinfo__detail">
      <div css={thumbnailStyle()} className="detail__thumbnail">
        {props.avatar}
      </div>
      <div
        css={userDetailStyle()}
        className="detail__user"
        dir={localize(props.lang)}
      >
        <div css={userNameStyle()} className="user__name">
          {props.title}
        </div>
        <p css={userStatusStyle(props)} className="user__status">
          {localize("ONLINE")}
        </p>
      </div>
    </div>
  );
};

// Specifies the default values for props:
CometChatUserProfileItem.defaultProps = {
  user: null,
  title: "",
  titleColor: "#141414",
  titleFont: "600 15px Inter",
  subTitle: "",
  subTitleColor: "rgba(20, 20, 20, 0.8)",
  subTitleFont: "400 13px Inter",
  backgroundColor: "#ffffff",
  statusIndicator: null,
  avatar: <CometChatAvatar user={this} />,
};

CometChatUserProfileItem.propTypes = {
  user: PropTypes.object,
  title: PropTypes.string,
  titleColor: PropTypes.string,
  titleFont: PropTypes.string,
  subTitle: PropTypes.string,
  subTitleColor: PropTypes.string,
  subTitleFont: PropTypes.string,
  backgroundColor: PropTypes.string,
  statusIndicator: PropTypes.object,
  avatar: PropTypes.object,
};

export { CometChatUserProfileItem };
