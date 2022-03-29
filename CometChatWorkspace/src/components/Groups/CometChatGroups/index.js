import React from "react";
import PropTypes from "prop-types";

import {
  CometChatListBase,
  CometChatGroupList,
  localize,
  CometChatTheme,
  GroupListConfiguration
} from "../../";

import { fontStyle } from "../CometChatGroupHelper";

import { Hooks } from "./hooks";
import { containerStyle, createGroupBtnStyle } from "./style";

import createIcon from "./resources/create.svg";
import searchIcon from "./resources/search.svg";
import backIcon from "./resources/back.svg";


/**
 *
 * CometChatGroups is a container component that wraps and
 * formats CometChatListBase and CometChatGroupList component, with no behavior of its own.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */

const Groups = props => {
	const [searchInput, setSearchInput] = React.useState("");
	const [theme, setTheme] = React.useState(new CometChatTheme());

	const getCreateGroupButtonElem = () => {
		if (!props.hideCreateGroup) {
			return <div style={createGroupBtnStyle(props)}></div>;
		}
		return null;
	};

	const searchHandler = searchText => {
		setSearchInput(searchText);
	};

	Hooks(props, setTheme);

	const getListBaseStyle = () => {
		return {
			width: "100%",
			height: "100%",
			border: "0px none",
			cornerRadius: props.style?.cornerRadius,
			background: props.style.background || theme.palette.background[theme.palette.mode],
			titleFont: props.style?.titleFont || fontStyle(theme.typography.heading),
			titleColor: props.style?.titleColor || theme.palette.accent[theme.palette.mode],
			backIconTint: props.style?.backIconTint || theme.palette.primary[theme.palette.mode],
			searchBorder: props.style?.searchBorder || "1px solid " + theme.palette.accent50[theme.palette.mode],
			searchCornerRadius: props.style?.searchCornerRadius || "8px",
			searchBackground: props.style?.searchBackground || theme.palette.accent50[theme.palette.mode],
			searchTextColor: props.style?.searchTextColor || theme.palette.accent500[theme.palette.mode],
			searchIconTint: props.style?.searchIconTint || theme.palette.accent500[theme.palette.mode],
			searchTextFont: props.style?.searchTextFont || fontStyle(theme.typography.text1),
		};
	};

	const getListStyle = () => {
		return {
			width: "100%",
			height: "100%",
			background: "transparent",
			border: "0 none",
			cornerRadius: "0",
			loadingIconTint: theme.palette.accent600[theme.palette.mode],
			emptyTextFont: fontStyle(theme.typography.heading),
			emptyTextColor: theme.palette.accent400[theme.palette.mode],
			errorTextFont: fontStyle(theme.typography.heading),
			errorTextColor: theme.palette.accent400[theme.palette.mode],
		};
	};

	const groupListConfig = new GroupListConfiguration();
	const limit = props.configurations?.groupListConfiguration?.limit || groupListConfig.limit;
	const searchKeyword = props.configurations?.groupListConfiguration?.searchKeyword || groupListConfig.searchKeyword;
	const tags = props.configurations?.groupListConfiguration?.tags || groupListConfig.tags;
	const hideError = props.configurations?.groupListConfiguration?.hideError || groupListConfig.hideError;
	const customView = props.configurations?.groupListConfiguration?.customView || groupListConfig.customView;
	const loadingIconURL = props.configurations?.groupListConfiguration?.loadingIconURL || groupListConfig.loadingIconURL;
	const onErrorCallback = props.configurations?.groupListConfiguration?.onErrorCallback || groupListConfig.onErrorCallBack;
	const joinedOnly = props.configurations?.groupListConfiguration?.joinedOnly || groupListConfig.joinedOnly;

	return (
		<div style={containerStyle(props)} className="cometchat__groups">
			{getCreateGroupButtonElem()}
			<CometChatListBase
				title={props.title}
				searchPlaceholder={searchInput ? searchInput : props.searchPlaceholder}
				onSearch={searchHandler}
				style={getListBaseStyle()}
				backButtonIconURL={backIcon}
				searchIconURL={searchIcon}
				createGroupIconURL={createIcon}
				showBackButton={props.showBackButton}
				hideSearch={props.hideSearch}>
				<CometChatGroupList
					limit={limit}
					searchKeyword={searchInput ? searchInput : searchKeyword}
					joinedOnly={joinedOnly}
					tags={tags}
					style={getListStyle()}
					customView={customView}
					loadingIconURL={loadingIconURL}
					emptyText={localize("NO_GROUPS_FOUND")}
					errorText={localize("SOMETHING_WENT_WRONG")}
					hideError={hideError}
					onErrorCallback={onErrorCallback}
					activeGroup={{}}
					configurations={props.configurations}
				/>
			</CometChatListBase>
		</div>
	);
};

Groups.defaultProps = {
	title: "Groups",
	searchPlaceholder: "Search",
	activeGroup: {},
	style: {
		width: "100%",
		height: "100%",
		border: "1px solid #808080",
		cornerRadius: "8px",
		background: "",
		titleFont: "700 22px Inter, sans-serif",
		titleColor: "",
		backIconTint: "#3399FF",
		createGroupIconTint: "#3399FF",
		searchBorder: "1px solid #141414",
		searchCornerRadius: "8px",
		searchBackground: "",
		searchTextFont: "",
		searchTextColor: "",
		searchIconTint: "",
	},
	createGroupIconURL: createIcon,
	backButtonIconURL: backIcon,
	searchIconURL: searchIcon,
	showBackButton: false,
	hideCreateGroup: true,
	hideSearch: false,
};

Groups.propTypes = {
	title: PropTypes.string,
	searchPlaceholder: PropTypes.string,
	activeGroup: PropTypes.object,
	style: PropTypes.object,
	createGroupIconURL: PropTypes.string,
	backButtonIconURL: PropTypes.string,
	searchIconURL: PropTypes.string,
	showBackButton: PropTypes.bool,
	hideCreateGroup: PropTypes.bool,
	hideSearch: PropTypes.bool,
};

export const CometChatGroups = React.memo(Groups);