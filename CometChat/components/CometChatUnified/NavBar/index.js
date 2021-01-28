import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';

import CometChatUserList from "../../CometChatUserList";
import CometChatGroupList from "../../CometChatGroupList";
import CometChatConversationList from "../../CometChatConversationList";
import CometChatUserInfoScreen from "../../CometChatUserInfoScreen";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

import {
  footerStyle,
  navbarStyle,
  itemStyle,
  itemLinkStyle
} from "./style";

import chatGreyIcon from "./resources/chats-grey.png";
import chatBlueIcon from "./resources/chats-blue.png";
import contactGreyIcon from "./resources/contacts-grey.png";
import contactBlueIcon from "./resources/contacts-blue.png";
import groupGreyIcon from "./resources/groups-grey.png";
import groupBlueIcon from "./resources/groups-blue.png";
import moreGreyIcon from "./resources/userinfo-grey.png";
import moreBlueIcon from "./resources/userinfo-blue.png";

class Navbar extends React.Component {

  constructor(props) {
    super(props);
    this.chatListRef = React.createRef();
  }

  updateLastMessage = (message) => {

    if (this.props.activeTab !== this.props.tabs["CHATS"]) {
      return false;
    }
    
    this.chatListRef.updateLastMessage(message);
  }

  getDefaultComponent = () => {

    switch (this.props.activeTab) {
      case "users":
        return <CometChatUserList
          theme={this.props.theme}
          item={this.props.item}
          type={this.props.type}
          lang={this.props.lang}
          actionGenerated={this.props.actionGenerated}
          enableCloseMenu={this.props.enableCloseMenu}
          onItemClick={(item, type) => this.props.actionGenerated("itemClicked", type, item)} />;
      case "calls":
        return "calls";
      case "chats":
        return <CometChatConversationList
          ref={el => this.chatListRef = el}
          theme={this.props.theme}
          item={this.props.item}
          type={this.props.type}
          lang={this.props.lang}
          groupToLeave={this.props.groupToLeave}
          groupToDelete={this.props.groupToDelete}
          groupToUpdate={this.props.groupToUpdate}
          messageToMarkRead={this.props.messageToMarkRead}
          lastMessage={this.props.lastMessage}
          unreadMessages={this.props.unreadMessages}
          actionGenerated={this.props.actionGenerated}
          enableCloseMenu={this.props.enableCloseMenu}
          onItemClick={(item, type) => this.props.actionGenerated("itemClicked", type, item)} />;
      case "groups":
        return <CometChatGroupList
          theme={this.props.theme}
          item={this.props.item}
          type={this.props.type}
          lang={this.props.lang}
          groupToLeave={this.props.groupToLeave}
          groupToDelete={this.props.groupToDelete}
          groupToUpdate={this.props.groupToUpdate}
          actionGenerated={this.props.actionGenerated}
          enableCloseMenu={this.props.enableCloseMenu}
          onItemClick={(item, type) => this.props.actionGenerated("itemClicked", type, item)} />;
      case "info":
        return <CometChatUserInfoScreen
          theme={this.props.theme}
          lang={this.props.lang}
          onItemClick={(item, type) => this.props.actionGenerated("itemClicked", type, item)} />;
      default:
        return null;
    }
  }

  render() {

    const chatsTabActive = (this.props.activeTab === this.props.tabs["CHATS"]) ? true : false;
    const userTabActive = (this.props.activeTab === this.props.tabs["USERS"]) ? true : false;
    const groupsTabActive = (this.props.activeTab === this.props.tabs["GROUPS"]) ? true : false;
    const moreTabActive = (this.props.activeTab === this.props.tabs["INFO"]) ? true : false;

    return (
      <React.Fragment>
        {this.getDefaultComponent()}
        <div css={footerStyle()} className="sidebar__footer">
          <div css={navbarStyle()} className="footer__navbar">
            <div css={itemStyle()} className="navbar__item" onClick={() => this.props.actionGenerated('tabChanged', this.props.tabs["CHATS"])}>
              <div 
              css={itemLinkStyle(chatGreyIcon, chatBlueIcon, chatsTabActive, this.props.tabs["CHATS"])} 
              className="item__link item__link__chats"
              title={Translator.translate("CHATS", this.props.lang)}></div>
            </div>
            <div css={itemStyle()} className="navbar__item" onClick={() => this.props.actionGenerated('tabChanged', this.props.tabs["USERS"])}>
              <div 
              css={itemLinkStyle(contactGreyIcon, contactBlueIcon, userTabActive, this.props.tabs["USERS"])} 
              className="item__link item__link__contacts"
              title={Translator.translate("USERS", this.props.lang)}></div>
            </div>
            <div css={itemStyle()} className="navbar__item" onClick={() => this.props.actionGenerated('tabChanged', this.props.tabs["GROUPS"])}>
              <div 
              css={itemLinkStyle(groupGreyIcon, groupBlueIcon, groupsTabActive, this.props.tabs["GROUPS"])} 
              className="item__link item__link__groups"
              title={Translator.translate("GROUPS", this.props.lang)}></div>
            </div>
            <div css={itemStyle()} className="navbar__item" onClick={() => this.props.actionGenerated('tabChanged', this.props.tabs["INFO"])}>
              <div 
              css={itemLinkStyle(moreGreyIcon, moreBlueIcon, moreTabActive, this.props.tabs["INFO"])} 
              className="item__link item__link__info"
              title={Translator.translate("MORE", this.props.lang)}></div>
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

// Specifies the default values for props:
Navbar.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

Navbar.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default Navbar;