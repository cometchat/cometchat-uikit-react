import React, { useState } from "react";
import PropTypes from "prop-types";

import {
  CometChatAvatar,
  CometChatStatusIndicator,
  localize,
  AvatarConfiguration,
  StatusIndicatorConfiguration,
  DataItemStyles,
  AvatarStyles,
  StatusIndicatorStyles,
  CometChatTheme,
  fontHelper,
  GroupTypeConstants,
  UserStatusConstants,
} from "../..";

import { groupTypeColorCode } from "../../../Groups/CometChatGroupConstants";

import {
  dataItemStyle,
  dataItemDetailStyle,
  dataItemThumbnailStyle,
  dataItemNameStyle,
  dataItemSubtitleStyle,
} from "./style";

import passwordIcon from "./resources/passwordIcon.svg";
import privateIcon from "./resources/privateIcon.svg";
import { CometChat } from "@cometchat-pro/chat";

const CometChatDataItem = (props) => {
  const {
    isActive,
    user,
    group,
    groupMember,
    onClick,

    inputData,
    style,
    tail,
    options,
    avatarConfguration,
    statusIndicatorConfiguration,
    theme,
  } = props;

  /**
   * Component internal state
   */
  const [isHovering, setIsHovering] = useState(false);

  /**
   * Component private scoping
   */
  const _avatarConfiguration = new AvatarConfiguration(
    avatarConfguration ?? {}
  );
  const _statusIndicatorConfiguration = new StatusIndicatorConfiguration(
    statusIndicatorConfiguration ?? {}
  );
  const _theme = new CometChatTheme(theme ?? {});

  let _isActive = isHovering || isActive;

  const toggleActiveObject = () => {
    setIsHovering(!isHovering);
  };
  //avatar
  const getAvatar = () => {
    let avatar = null;

    const outerViewWidth = _avatarConfiguration?.style?.outerViewWidth;
    const outerView = `${outerViewWidth} solid ${_theme?.palette?.getPrimary()}`;
    const borderWidth = _avatarConfiguration?.style?.borderWidth;
    let avatarStyle = new AvatarStyles({
      width: _avatarConfiguration?.style?.width,
      height: _avatarConfiguration?.style?.height,
      outerViewSpacing: _avatarConfiguration?.style?.outerViewSpacing,
      outerView: _avatarConfiguration?.style?.outerView || outerView,
      textColor:
        _avatarConfiguration?.style?.textColor ||
        _theme?.palette?.getAccent900(),
      textFont:
        _avatarConfiguration?.style?.textFont ||
        fontHelper(_theme?.typography?.name),
      border: `${borderWidth} solid ${_theme?.palette?.getAccent600()}`,
      borderRadius: _avatarConfiguration?.style?.borderRadius,
      backgroundSize: _avatarConfiguration?.style?.backgroundSize,
      backgroundColor:
        _avatarConfiguration?.style?.backgroundColor ||
        _theme?.palette?.getAccent600(),
    });

    let name;
    let image;
    if (inputData?.thumbnail && user) {
      name = user?.name;
      image = user?.avatar;
    } else if (inputData?.thumbnail && group) {
      name = group?.name;
      image = group?.icon;
    } else if (inputData?.thumbnail && groupMember) {
      name = groupMember?.name;
      image = groupMember?.avatar;
    }

    if (inputData?.thumbnail && image) {
      avatar = <CometChatAvatar image={image} style={avatarStyle} />;
    } else if (inputData?.thumbnail && name) {
      avatar = <CometChatAvatar name={name} style={avatarStyle} />;
    }

    return avatar;
  };

  //status indicator
  const getPresence = () => {
    const statusIndicatorStyles = new StatusIndicatorStyles({
      width: _statusIndicatorConfiguration?.style?.width,
      height: _statusIndicatorConfiguration?.style?.height,
      border:
        _statusIndicatorConfiguration?.style?.border ||
        `2px solid ${_theme?.palette?.getBackground()}`,
      borderRadius: _statusIndicatorConfiguration?.style?.borderRadius,
    });

    let backgroundImage;
    let backgroundColor;
    if (inputData?.status) {
      if (group) {
        if (group?.type === GroupTypeConstants?.private) {
          backgroundImage = privateIcon;
          backgroundColor = groupTypeColorCode?.private;
        } else if (group?.type === GroupTypeConstants?.password) {
          backgroundImage = passwordIcon;
          backgroundColor = groupTypeColorCode?.password;
        }
      } else if (user && user?.status === UserStatusConstants.online) {
        backgroundColor = _theme?.palette?.getSuccess();
      } else if (
        groupMember &&
        groupMember?.status === UserStatusConstants.online
      ) {
        backgroundColor = _theme?.palette?.getSuccess();
      }
    }

    if (backgroundImage || backgroundColor) {
      return (
        <CometChatStatusIndicator
          backgroundImage={backgroundImage}
          style={{
            ...statusIndicatorStyles,
            backgroundColor: backgroundColor,
          }}
        />
      );
    } else return null;
  };

  const getTitle = () => {
    let title;
    if (inputData?.title && user?.name) {
      title = user?.name;
    } else if (inputData?.title && group?.name) {
      title = group?.name;
    } else if (inputData?.title && groupMember?.name) {
      title = groupMember?.name;
    }

    return <div>{title}</div>;
  };

  const getSubtitle = () => {
    let subtitle;
    if (inputData?.subtitle) {
      subtitle = inputData?.subtitle(user || group || groupMember);
    } else if (user?.status) {
      subtitle = user?.status;
    } else if (group?.membersCount) {
      subtitle = `${group?.membersCount} ${localize("MEMBERS")}`;
    }

    return <div>{subtitle} </div>;
  };

  return (
    <div
      className="data__item"
      style={dataItemStyle(style, _theme, _isActive)}
      onClick={onClick?.bind(this, user ?? group ?? groupMember)}
      onMouseEnter={toggleActiveObject}
      onMouseLeave={toggleActiveObject}
    >
      <div
        style={dataItemThumbnailStyle(style, _theme)}
        className="item__thumbnail"
      >
        {getAvatar()}
        {getPresence()}
      </div>
      <div style={dataItemDetailStyle(style, _theme)} className="item__details">
        <div style={dataItemNameStyle(style, _theme)} className="item__title">
          {getTitle()}
        </div>

        <div
          style={dataItemSubtitleStyle(style, _theme)}
          className="item__subtitle"
        >
          {getSubtitle()}
        </div>
      </div>
    </div>
  );
};

CometChatDataItem.defaultProps = {
  inputData: {
    id: "id",
    thumbnail: true,
    status: true,
    title: true,
    subtitle: "", //callback function
  },
  style: {
    height: "100%",
    width: "100%",
    background: "",
    activeBackground: "",
    borderRadius: "8px",
    titleFont: "600 15px Inter,sans-serif",
    titleColor: "rgb(20,20,20)",
    subtitleFont: "400 13px Inter, sans-serif",
    subtitleColor: "rgba(20, 20, 20, 0.58)",
  },
  user: null,
  group: null,
  groupMember: null,
  options: [], //video, audio, info.
  tail: "", //view or component
  isActive: false,
  avatarConfguration: {},
  statusIndicatorConfiguration: {},
};

CometChatDataItem.propTypes = {
  inputData: PropTypes.object,
  user: PropTypes.object,
  group: PropTypes.object,
  groupMember: PropTypes.object,
  onClick: PropTypes.func,
  options: PropTypes.array,
  tail: PropTypes.string, //view or component
  isActive: PropTypes.bool,
  style: PropTypes.object,
  avatarConfguration: PropTypes.object,
  statusIndicatorConfiguration: PropTypes.object,
  theme: PropTypes.object,
};
export { CometChatDataItem };
