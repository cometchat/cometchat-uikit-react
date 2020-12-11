import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import CometChatUserList from "../../CometChatUserList";
import CometChatGroupList from "../../CometChatGroupList";
import CometChatConversationList from "../../CometChatConversationList";
import CometChatUserInfoScreen from "../../CometChatUserInfoScreen";

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
    
    this.sidebar = React.createRef();
  }

  getDefaultComponent = () => {

    switch (this.props.tab) {
      case "contacts":
        return <CometChatUserList
          theme={this.props.theme}
          item={this.props.item}
          type={this.props.type}
          actionGenerated={this.props.actionGenerated}
          enableCloseMenu={this.props.enableCloseMenu}
          onItemClick={(item, type) => this.props.actionGenerated("itemClicked", type, item)} />;
      case "calls":
        return "calls";
      case "conversations":
        return <CometChatConversationList
          ref={this.sidebar}
          theme={this.props.theme}
          item={this.props.item}
          type={this.props.type}
          groupToUpdate={this.props.groupToUpdate}
          messageToMarkRead={this.props.messageToMarkRead}
          lastMessage={this.props.lastMessage}
          actionGenerated={this.props.actionGenerated}
          enableCloseMenu={this.props.enableCloseMenu}
          onItemClick={(item, type) => this.props.actionGenerated("itemClicked", type, item)} />;
      case "groups":
        return <CometChatGroupList
          theme={this.props.theme}
          item={this.props.item}
          type={this.props.type}
          groupToLeave={this.props.groupToLeave}
          groupToDelete={this.props.groupToDelete}
          groupToUpdate={this.props.groupToUpdate}
          actionGenerated={this.props.actionGenerated}
          enableCloseMenu={this.props.enableCloseMenu}
          onItemClick={(item, type) => this.props.actionGenerated("itemClicked", type, item)} />;
      case "info":
        return <CometChatUserInfoScreen
          theme={this.props.theme}
          onItemClick={(item, type) => this.props.actionGenerated("itemClicked", type, item)} />;
      default:
        return null;
    }

  }


  render() {

    const chatsTabActive = (this.props.tab === "conversations") ? true : false;
    const userTabActive = (this.props.tab === "contacts") ? true : false;
    const groupsTabActive = (this.props.tab === "groups") ? true : false;
    const moreTabActive = (this.props.tab === "info") ? true : false;

    return (
      <React.Fragment>
        {this.getDefaultComponent()}
        <div css={footerStyle()} className="sidebar__footer">
          <div css={navbarStyle()} className="footer__navbar">
            <div css={itemStyle()} className="navbar__item" onClick={() => this.props.actionGenerated('tabChanged', 'conversations')}>
              <div css={itemLinkStyle(chatGreyIcon, chatBlueIcon, chatsTabActive, "chats")} className="item__link item__link__chats"></div>
            </div>
            <div css={itemStyle()} className="navbar__item" onClick={() => this.props.actionGenerated('tabChanged', 'contacts')}>
              <div css={itemLinkStyle(contactGreyIcon, contactBlueIcon, userTabActive, "contacts")} className="item__link item__link__contacts"></div>
            </div>
            <div css={itemStyle()} className="navbar__item" onClick={() => this.props.actionGenerated('tabChanged', 'groups')}>
              <div css={itemLinkStyle(groupGreyIcon, groupBlueIcon, groupsTabActive, "groups")} className="item__link item__link__groups"></div>
            </div>
            <div css={itemStyle()} className="navbar__item" onClick={() => this.props.actionGenerated('tabChanged', 'info')}>
              <div css={itemLinkStyle(moreGreyIcon, moreBlueIcon, moreTabActive, "userinfo")} className="item__link item__link__info"></div>
            </div>
          </div>
        </div>
      </React.Fragment>
    )

  }
}

export default Navbar;