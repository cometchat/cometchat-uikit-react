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

import chatGreyIcon from "./resources/chat-grey-icon.svg";
import chatBlueIcon from "./resources/chat-blue-icon.svg";
import contactGreyIcon from "./resources/people-grey-icon.svg";
import contactBlueIcon from "./resources/people-blue-icon.svg";
import groupGreyIcon from "./resources/group-chat-grey-icon.svg";
import groupBlueIcon from "./resources/group-chat-blue-icon.svg";
import moreGreyIcon from "./resources/more-grey-icon.svg";
import moreBlueIcon from "./resources/more-blue-icon.svg";


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
              <span css={itemLinkStyle(chatGreyIcon, chatBlueIcon, chatsTabActive)} className="item__link item__link__chats"></span>
            </div>
            <div css={itemStyle()} className="navbar__item" onClick={() => this.props.actionGenerated('tabChanged', 'contacts')}>
              <span css={itemLinkStyle(contactGreyIcon, contactBlueIcon, userTabActive)} className="item__link item__link__contacts"></span>
            </div>
            <div css={itemStyle()} className="navbar__item" onClick={() => this.props.actionGenerated('tabChanged', 'groups')}>
              <span css={itemLinkStyle(groupGreyIcon, groupBlueIcon, groupsTabActive)} className="item__link item__link__groups"></span>
            </div>
            <div css={itemStyle()} className="navbar__item" onClick={() => this.props.actionGenerated('tabChanged', 'info')}>
              <span css={itemLinkStyle(moreGreyIcon, moreBlueIcon, moreTabActive)} className="item__link item__link__info"></span>
            </div>
          </div>
        </div>
      </React.Fragment>
    )

  }
}

export default Navbar;