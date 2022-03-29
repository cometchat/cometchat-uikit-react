import React from "react";
import PropTypes from "prop-types";

import { CometChatAvatar, CometChatStatusIndicator, CometChatLocalize, CometChatTheme, AvatarConfiguration, StatusIndicatorConfiguration } from "../../";
import { CometChatGroupEvents } from "../../../";
import { groupType, groupTypeColorCode } from "../../../Groups/CometChatGroupConstants";

import { fontStyle } from "../../../Groups/CometChatGroupHelper";
import { Hooks } from "./hooks";

import { listItem, itemThumbnailStyle, itemDetailStyle, itemNameStyle, itemNameWrapperStyle, itemDescStyle, listItemName } from "./style";

import shieldIcon from "./resources/password-protected-group.svg";
import lockIcon from "./resources/private-group.svg";

/**
 *
 * CometChatGroupListItem is a Shared component. It formats list Item display such as group Icon, group name, etc
 * passed on from GroupList component.
 *
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
const GroupListItem = props => {
	const [theme, setTheme] = React.useState(new CometChatTheme());

	Hooks(props, setTheme);

	// Show Tooltip
	const showTooltip = event => {
		const elem = event.target;
		const scrollWidth = elem.scrollWidth;
		const clientWidth = elem.clientWidth;

		if (scrollWidth <= clientWidth) {
			return false;
		}
		elem.setAttribute("title", elem.textContent);
	};

	// Hide Tooltip
	const hideToolTip = event => {
		const elem = event.target;

		const scrollWidth = elem.scrollWidth;
		const clientWidth = elem.clientWidth;

		if (scrollWidth <= clientWidth) {
			return false;
		}
		elem.removeAttribute("title");
	};

	// ClickHandler for GroupListItem
	const clickHandler = () => {
		CometChatGroupEvents.emit(CometChatGroupEvents.onItemClick, props.groupObject);
	};

	// ID
	const getId = () => {
		return props.inputData.id && props.groupObject[props.inputData.id] ? props.groupObject[props.inputData.id] : "";
	};

	// Avatar
	const getAvatar = () => {
		let avatar;

		const avatarConfiguration = new AvatarConfiguration();

		const outerViewWidth = props?.configurations?.avatarConfiguration?.outerViewWidth || avatarConfiguration?.outerViewWidth;
		const outerView = `${outerViewWidth} solid ${theme.palette.primary[theme.palette.mode]}`;
		const borderWidth = props?.configurations?.avatarConfiguration?.borderWidth || avatarConfiguration?.borderWidth;

		let avatarStyle = {
			width: props?.configurations?.avatarConfiguration?.width || avatarConfiguration?.width,
			height: props?.configurations?.avatarConfiguration?.height || avatarConfiguration?.height,
			cornerRadius: props?.configurations?.avatarConfiguration?.cornerRadius || avatarConfiguration?.cornerRadius,
			outerView: outerView,
			outerViewSpacing: props?.configurations?.avatarConfiguration?.outerViewSpacing || avatarConfiguration?.outerViewSpacing,
			backgroundSize: props?.configurations?.avatarConfiguration?.backgroundSize || avatarConfiguration?.backgroundSize,
			backgroundColor: theme?.palette?.accent700[theme?.palette?.mode],
		};

		//if group object has thumbnail key
		if (props.inputData.thumbnail) {
			if (props.groupObject[props.inputData.thumbnail]) {
				// If Icon provided
				avatar = <CometChatAvatar {...avatarStyle} border="0 none" image={props.groupObject[props.inputData.thumbnail]} />;
			} else if (props.inputData.title && props.groupObject[props.inputData.title]) {
				//show initials for name
				avatar = (
					<CometChatAvatar
						{...avatarStyle}
						border={`${borderWidth} solid ${theme?.palette?.accent700[theme?.palette?.mode]}`}
						name={props.groupObject[props.inputData.title]}
						nameTextFont={fontStyle(theme.typography.name)}
						nameTextColor={theme.palette.accent900[theme.palette.mode]}
					/>
				);
			}
		}

		return avatar;
	};

	// GroupTypeIcon for Private Or Public Group
	const getGroupType = () => {
		let groupTypeComponent;
		if (props.inputData.status && props.groupObject[props.inputData.status]) {
			const statusIndicatorConfiguration = new StatusIndicatorConfiguration();

			const width = props?.configurations?.statusIndicatorConfiguration?.width || statusIndicatorConfiguration?.width;
			const height = props?.configurations?.statusIndicatorConfiguration?.height || statusIndicatorConfiguration?.height;
			const border = props?.configurations?.statusIndicatorConfiguration?.border || statusIndicatorConfiguration?.border;
			const cornerRadius = props?.configurations?.statusIndicatorConfiguration?.cornerRadius || statusIndicatorConfiguration?.cornerRadius;

			if (props.groupObject[props.inputData.status] === groupType.private) {
				groupTypeComponent = (
					<CometChatStatusIndicator backgroundImage={shieldIcon} backgroundColor={groupTypeColorCode.private} style={{ position: "absolute", top: "25px", left: "28px" }} width={width} height={height} border={border} cornerRadius={cornerRadius} />
				);
			} else if (props.groupObject[props.inputData.status] === groupType.password) {
				groupTypeComponent = (
					<CometChatStatusIndicator backgroundImage={lockIcon} backgroundColor={groupTypeColorCode.password} style={{ position: "absolute", top: "25px", left: "28px" }} width={width} height={height} border={border} cornerRadius={cornerRadius} />
				);
			}
		}

		return groupTypeComponent;
	};

	// Title or name of the Group
	const getTitle = () => {
		return props.inputData.title && props.groupObject[props.inputData.title] ? props.groupObject[props.inputData.title] : "";
	};

	// Subtitle of the Group
	const getSubTitle = () => {
		let subTitle;
		if (props.inputData.subtitle instanceof Function) {
			subTitle = props.inputData.subtitle(props.groupObject);
		} else {
			if (props.inputData.subtitle && props.groupObject[props.inputData.subtitle]) {
				subTitle = props.groupObject[props.inputData.subtitle];
			} else if (props.inputData.subtitle && props.groupObject.metadata && props.groupObject.metadata[props.inputData.subtitle]) {
				subTitle = props.groupObject.metadata[props.inputData.subtitle];
			}
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

	return (
		<div data-id={getId()} style={listItem(props, theme)} onClick={clickHandler} className="list__item">
			<div style={itemThumbnailStyle()} className="item__thumbnail">
				{getAvatar()}
				{getGroupType()}
			</div>
			<div style={itemDetailStyle(props, theme)} className="item__details" dir={CometChatLocalize.getDir()}>
				<div style={itemNameStyle(props)} className="item__title" onMouseEnter={showTooltip} onMouseLeave={hideToolTip}>
					{getTitle()}
					{/* <p style={listItemName(props)}>{getTitle()}</p> */}
				</div>
				{getSubTitle()}
			</div>
		</div>
	);
};

GroupListItem.defaultProps = {
	inputData: {
		id: "guid",
		thumbnail: "icon",
		status: "type",
		title: "name",
		subtitle: "membersCount",
	},
	style: {
		width: "100%",
		height: "auto",
		background: "transparent",
		activeBackground: "transparent",
		border: "",
		cornerRadius: "8px",
		titleColor: "#141414",
		titleFont: "600 15px Inter,sans-serif",
		subtitleColor: "#adb5bd",
		subtitleFont: "400 13px Inter,sans-serif",
	},
	isActive: false,
	groupOptions: [],
	groupObject: {
		guid: "supergroup",
		icon: "https://data-us.cometchat.io/assets/images/avatars/supergroup.png",
		membersCount: 123,
		name: "Comic Superhero Hangout",
		metadata: {
			phonenum: 4234324,
			gender: "male",
		},
	},
	configurations: {},
};

GroupListItem.propTypes = {
	inputData: PropTypes.object,
	style: PropTypes.object,
	isActive: PropTypes.bool,
	groupOptions: PropTypes.array,
	groupObject: PropTypes.object,
};

export const CometChatGroupListItem = React.memo(GroupListItem);