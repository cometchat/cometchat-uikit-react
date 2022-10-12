import React from "react";
import PropTypes from "prop-types";

import { CometChatUserEvents } from "../../../";
import { CometChatAvatar, CometChatStatusIndicator, CometChatLocalize, CometChatTheme, AvatarConfiguration, StatusIndicatorConfiguration, fontHelper } from "../../";
import { userStatus, userStatusColorCode } from "../../../Users/CometChatUserConstants";

import { Hooks } from "./hooks";

import {
  listItem,
  itemThumbnailStyle,
  itemDetailStyle,
  itemNameStyle,
  itemDescStyle,
} from "./style";

const UserListItem = (props) => {

	const [theme, setTheme] = React.useState(new CometChatTheme({}));

  const showTooltip = (event) => {
    const elem = event.target;
    const scrollWidth = elem.scrollWidth;
    const clientWidth = elem.clientWidth;

    if (scrollWidth <= clientWidth) {
      return false;
    }

    elem.setAttribute("title", elem.textContent);
  };

  const hideToolTip = (event) => {
    const elem = event.target;
    const scrollWidth = elem.scrollWidth;
    const clientWidth = elem.clientWidth;

    if (scrollWidth <= clientWidth) {
      return false;
    }

    elem.removeAttribute("title");
  };

  const clickHandler = () => {
    CometChatUserEvents.emit(CometChatUserEvents.onItemClick, props.userObject);
  };

  const getId = () => {
    return props.inputData.id && props.userObject[props.inputData.id]
      ? props.userObject[props.inputData.id]
      : "";
  };

  const getAvatar = () => {

    	let avatar;
		
		const avatarConfiguration = new AvatarConfiguration();

		const outerViewWidth = props.configurations?.avatarConfiguration?.outerViewWidth || avatarConfiguration.outerViewWidth;
		const outerView = `${outerViewWidth} solid ${theme?.palette?.getPrimary()}`;
		const borderWidth = props?.configurations?.avatarConfiguration?.borderWidth || avatarConfiguration.borderWidth;
		
		let avatarStyle = {
			width: props?.configurations?.avatarConfiguration?.width || avatarConfiguration.width,
			height: props?.configurations?.avatarConfiguration?.height || avatarConfiguration.height,
			borderRadius: props?.configurations?.avatarConfiguration?.borderRadius || avatarConfiguration?.borderRadius,
			outerView: outerView,
			outerViewSpacing: props.configurations?.avatarConfiguration?.outerViewSpacing || avatarConfiguration.outerViewSpacing,
			backgroundSize: props.configurations?.avatarConfiguration?.backgroundSize || avatarConfiguration.backgroundSize,
			backgroundColor: theme?.palette?.accent700[theme?.palette?.mode],
		};

		if (props.inputData.thumbnail) {

			if (props.userObject[props.inputData.thumbnail]) {
				avatar = <CometChatAvatar {...avatarStyle} border="0 none" image={props.userObject[props.inputData.thumbnail]} />;
			} else if (props.inputData.title && props.userObject[props.inputData.title]) {
				avatar = (
					<CometChatAvatar
						{...avatarStyle}
						border={`${borderWidth} solid ${theme?.palette?.accent700[theme?.palette?.mode]}`}
						nameTextFont={fontHelper(theme?.typography?.name)}
						nameTextColor={theme?.palette?.getAccent900()}
						name={props.userObject[props.inputData.title]}
					/>
				);
			}
		}
		
    	return avatar;
	}

  const getPresence = () => {
    let presence;
    if(props.inputData.status && props.userObject[props.inputData.status]) {

		if (props.userObject[props.inputData.status] === userStatus.online) {

			const statusIndicatorConfiguration = new StatusIndicatorConfiguration();

			const width = props?.configurations?.statusIndicatorConfiguration?.width || statusIndicatorConfiguration?.width;
			const height = props?.configurations?.statusIndicatorConfiguration?.height || statusIndicatorConfiguration?.height;
			const border = props?.configurations?.statusIndicatorConfiguration?.border || statusIndicatorConfiguration?.border;
			const borderRadius = props?.configurations?.statusIndicatorConfiguration?.borderRadius || statusIndicatorConfiguration?.borderRadius;

			presence = (
				<CometChatStatusIndicator
					backgroundColor={userStatusColorCode.online}
					style={{ position: "absolute", top: "23px", left: "27px" }}
					width={width}
					height={height}
					border={border}
					borderRadius={borderRadius}
				/>
			);
		}      	
    }

    return presence;
  };

  const getTitle = () => {
    let title;
    if (props.inputData.title && props.userObject[props.inputData.title]) {
      title = props.userObject[props.inputData.title];
    }
    return title;
  };

  const getSubTitle = () => {
    let subTitle;
    if (typeof props.inputData.subtitle === "string") {
      if (
        props.inputData.subtitle &&
        props.userObject.hasOwnProperty([props.inputData.subtitle])
      ) {
        subTitle = props.userObject[props.inputData.subtitle];
      } else if (
        props.inputData.subtitle &&
        props.userObject.metadata &&
        props.userObject.metadata.hasOwnProperty([props.inputData.subtitle])
      ) {
        subTitle = props.userObject.metadata[props.inputData.subtitle];
      }
    } else if (typeof props.inputData.subtitle === "function") {
      subTitle = props.inputData.subtitle(props.userObject);
    }

    if (subTitle) {
      return (
        <div style={itemDescStyle(props)} className="item__subtitle">
          {subTitle}
        </div>
      );
    }

    return null;
  };

  Hooks(props, setTheme);

  return (
    <div
      data-id={getId()}
      style={listItem(props, theme)}
      onClick={clickHandler}
      className="list__item"
    >
      <div style={itemThumbnailStyle(props)} className="item__thumbnail">
        {getAvatar()}
        {getPresence()}
      </div>
      <div
        style={itemDetailStyle(props, theme)}
        className="item__details"
        dir={CometChatLocalize.getDir()}
      >
        <div
          style={itemNameStyle(props)}
          className="item__title"
          onMouseEnter={showTooltip}
          onMouseLeave={hideToolTip}
        >
          {getTitle()}
        </div>
        <div style={itemDescStyle(props)} className="item__subtitle">
          {getSubTitle()}
        </div>
      </div>
    </div>
  );
};

// Specifies the default values for props:
UserListItem.defaultProps = {
	inputData: {
		id: "uid",
		thumbnail: "avatar",
		status: "status",
		title: "name",
		subtitle: () => {},
	},
	style: {
		width: "100%",
		height: "auto",
		background: "transparent",
		activeBackground: "transparent",
		border: "",
		borderRadius: "8px",
		titleColor: "#141414",
		titleFont: "600 15px Inter,sans-serif",
		subtitleColor: "#adb5bd",
		subtitleFont: "400 13px Inter,sans-serif",
	},
	isActive: false,
	userOptions: [],
	userObject: {
		uid: "3123-1231-2312-12312",
		avatar: "url",
		name: "xyz",
		status: "online",
		role: "ios",
	},
	configurations: {},
};

UserListItem.propTypes = {
  inputData: PropTypes.object,
  style: PropTypes.object,
  isActive: PropTypes.bool,
  userOptions: PropTypes.array,
  userObject: PropTypes.object,
  configurations: PropTypes.object,
};

export const CometChatUserListItem = React.memo(UserListItem);
