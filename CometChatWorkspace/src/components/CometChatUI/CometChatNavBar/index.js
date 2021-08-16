import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";

import { CometChatUserList } from "../../Users";
import { CometChatGroupList } from "../../Groups";
import { CometChatConversationList } from "../../Chats";
import { CometChatUserProfile } from "../../UserProfile";

import * as enums from "../../../util/enums.js";
import {CometChatContext} from "../../../util/CometChatContext";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";
import tabs from "../../../resources/tabs.json";

import {
  footerStyle,
  navbarStyle,
  itemStyle,
  itemLinkStyle,
  itemLinkTextStyle
} from "./style";

import chatGreyIcon from "./resources/chats.svg";
import contactGreyIcon from "./resources/users.svg";
import groupGreyIcon from "./resources/groups.svg";
import moreGreyIcon from "./resources/more.svg";

export class CometChatNavBar extends React.Component {
	static contextType = CometChatContext;

	tabListKeys = []; 
	constructor(props) {
		super(props);

		this.state = {
			activeTab: null,
			tabList: [],
		};
	}

	componentDidMount() {

		let tabList = this.context.UIKitSettings.tabs;

		tabList.forEach(tabName => {
			for (const t in tabs) {
				if (tabName === tabs[t]) {
					this.tabListKeys.push(t);
				}
			}
		});

    	this.getFilteredTabs().then(filteredTabs => {
			this.setState({tabList: filteredTabs, activeTab: filteredTabs[0]});
		});

	}


	getFilteredTabs = () => {

		return new Promise(resolve => {

			const filteredTabs = [];
			const promises = [this.enableChats(), this.enableUsers(), this.enableGroups(), this.enableSettings()];
			Promise.allSettled(promises).then(results => {
				
				this.tabListKeys.forEach(eachTabKey => {
					results.forEach(result => {
						const tabKey = result.value[0];
						const tabEnabled = result.value[1];

						if (eachTabKey === tabKey && tabEnabled === true) {
						filteredTabs.push(eachTabKey);
						}
					});
				});
				resolve(filteredTabs);
			});
		});
	}

	enableChats = () => {
		return new Promise(resolve => {
			this.context.FeatureRestriction.isRecentChatListEnabled()
				.then(response => resolve(["SIDEBAR_CHATS", response]))
				.catch(error => resolve(["SIDEBAR_CHATS", false]));
		});
	};

	enableUsers = () => {
		return new Promise(resolve => {
			this.context.FeatureRestriction.isUserListEnabled()
				.then(response => resolve(["SIDEBAR_USERS", response]))
				.catch(error => resolve(["SIDEBAR_USERS", false]));
		});
	};

	enableGroups = () => {
		return new Promise(resolve => {
			this.context.FeatureRestriction.isGroupListEnabled()
				.then(response => resolve(["SIDEBAR_GROUPS", response]))
				.catch(error => resolve(["SIDEBAR_GROUPS", false]));
		});
	};

	enableSettings = () => {
		return new Promise(resolve => {
			this.context.FeatureRestriction.isUserSettingsEnabled()
				.then(response => resolve(["SIDEBAR_MOREINFO", response]))
				.catch(error => resolve(["SIDEBAR_MOREINFO", false]));
		});
	};

	tabChanged = tab => {

		this.setState({activeTab: tab});
	};

	getActiveTab = () => {
		switch (this.state.activeTab) {
			case "SIDEBAR_USERS":
				return <CometChatUserList theme={this.props.theme} lang={this.context.language} _parent="unified" actionGenerated={this.props.actionGenerated} onItemClick={(item, type) => this.props.actionGenerated(enums.ACTIONS["ITEM_CLICKED"], type, item)} />;
			case "SIDEBAR_CALLS":
				return null;
			case "SIDEBAR_CHATS":
				return <CometChatConversationList theme={this.props.theme} lang={this.context.language} _parent="unified" actionGenerated={this.props.actionGenerated} onItemClick={(item, type) => this.props.actionGenerated(enums.ACTIONS["ITEM_CLICKED"], type, item)} />;
			case "SIDEBAR_GROUPS":
				return <CometChatGroupList theme={this.props.theme} lang={this.context.language} _parent="unified" actionGenerated={this.props.actionGenerated} onItemClick={(item, type) => this.props.actionGenerated(enums.ACTIONS["ITEM_CLICKED"], type, item)} />;
			case "SIDEBAR_MOREINFO":
				return <CometChatUserProfile theme={this.props.theme} lang={this.context.language} onItemClick={(item, type) => this.props.actionGenerated(enums.ACTIONS["ITEM_CLICKED"], type, item)} />;
			default:
				return null;
		}
	};

	getTabList = () => {

		const chatsTabActive = this.state.activeTab === "SIDEBAR_CHATS" ? true : false;
		const userTabActive = this.state.activeTab === "SIDEBAR_USERS" ? true : false;
		const groupsTabActive = this.state.activeTab === "SIDEBAR_GROUPS" ? true : false;
		const moreTabActive = this.state.activeTab === "SIDEBAR_MOREINFO" ? true : false;

		const tabList = [...this.state.tabList];

		return tabList.map(tab => {
			switch (tab) {
				case "SIDEBAR_CHATS":
					return (
						<div key={tab} css={itemStyle(this.props)} className="navbar__item" onClick={() => this.tabChanged("SIDEBAR_CHATS")}>
							<div css={itemLinkStyle(chatGreyIcon, chatsTabActive, this.context)} className="item__link item__link__chats" title={Translator.translate("CHATS", this.context.language)}></div>
							<div css={itemLinkTextStyle(chatsTabActive, this.context)} className="item__label">{Translator.translate("CHATS", this.context.language)}</div>
						</div>
					);
				case "SIDEBAR_USERS":
					return (
						<div key={tab} css={itemStyle(this.props)} className="navbar__item" onClick={() => this.tabChanged("SIDEBAR_USERS")}>
							<div css={itemLinkStyle(contactGreyIcon, userTabActive, this.context)} className="item__link item__link__contacts" title={Translator.translate("USERS", this.context.language)}></div>
							<div css={itemLinkTextStyle(userTabActive, this.context)} className="item__label">{Translator.translate("USERS", this.context.language)}</div>
						</div>
					);
				case "SIDEBAR_GROUPS":
					return (
						<div key={tab} css={itemStyle(this.props)} className="navbar__item" onClick={() => this.tabChanged("SIDEBAR_GROUPS")}>
							<div css={itemLinkStyle(groupGreyIcon, groupsTabActive, this.context)} className="item__link item__link__groups" title={Translator.translate("GROUPS", this.context.language)}></div>
							<div css={itemLinkTextStyle(groupsTabActive, this.context)} className="item__label">{Translator.translate("GROUPS", this.context.language)}</div>
						</div>
					);
				case "SIDEBAR_MOREINFO":
					return (
						<div key={tab} css={itemStyle(this.props)} className="navbar__item" onClick={() => this.tabChanged("SIDEBAR_MOREINFO")}>
							<div css={itemLinkStyle(moreGreyIcon, moreTabActive, this.context)} className="item__link item__link__info" title={Translator.translate("MORE", this.context.language)}></div>
							<div css={itemLinkTextStyle(moreTabActive, this.context)} className="item__label">{Translator.translate("MORE", this.context.language)}</div>
						</div>
					);
				default:
					return null;
			}
		});
	};

	render() {
		return (
			<React.Fragment>
				{this.getActiveTab()}
				<div css={footerStyle()} className="sidebar__footer">
					<div css={navbarStyle()} className="footer__navbar">
						{this.getTabList()}
					</div>
				</div>
			</React.Fragment>
		);
	}
}

// Specifies the default values for props:
CometChatNavBar.defaultProps = {
	theme: theme
};

CometChatNavBar.propTypes = {
	theme: PropTypes.object
}