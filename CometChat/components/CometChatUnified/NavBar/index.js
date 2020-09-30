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
        <div css={footerStyle()}>
          <div css={navbarStyle()}>
            <div css={itemStyle()} onClick={() => this.props.actionGenerated('tabChanged', 'conversations')}>
              <span css={itemLinkStyle(chatGreyIcon, chatBlueIcon, chatsTabActive)}></span>
            </div>
            <div css={itemStyle()} onClick={() => this.props.actionGenerated('tabChanged', 'contacts')}>
              <span css={itemLinkStyle(contactGreyIcon, contactBlueIcon, userTabActive)}></span>
            </div>
            <div css={itemStyle()} onClick={() => this.props.actionGenerated('tabChanged', 'groups')}>
              <span css={itemLinkStyle(groupGreyIcon, groupBlueIcon, groupsTabActive)}></span>
            </div>
            <div css={itemStyle()} onClick={() => this.props.actionGenerated('tabChanged', 'info')}>
              <span css={itemLinkStyle(moreGreyIcon, moreBlueIcon, moreTabActive)}></span>
            </div>
          </div>
        </div>
      </React.Fragment>
    )

  }
}

export default Navbar;

// const navbar = (props) => {

//   const switchComponent = () => {

//     switch (props.tab) {
//       case "contacts":
//         return <CometChatUserList 
//         theme={props.theme}
//         item={props.item}
//         actionGenerated={props.actionGenerated}
//         enableCloseMenu={props.enableCloseMenu}
//         onItemClick={(item, type) => props.actionGenerated("itemClicked", type, item)}></CometChatUserList>;
//       case "calls":
//         return "calls";
//       case "conversations":
//         return <CometChatConversationList
//         ref={defaultSidebar}
//         theme={props.theme}
//         item={props.item}
//         groupToUpdate={props.groupToUpdate}
//         actionGenerated={props.actionGenerated}
//         enableCloseMenu={props.enableCloseMenu}
//         onItemClick={(item, type) => props.actionGenerated("itemClicked", type, item)}></CometChatConversationList>;
//       case "groups":
//         return <CometChatGroupList 
//         theme={props.theme}
//         groupToLeave={props.groupToLeave}
//         groupToDelete={props.groupToDelete}
//         groupToUpdate={props.groupToUpdate}
//         actionGenerated={props.actionGenerated}
//         enableCloseMenu={props.enableCloseMenu}
//         onItemClick={(item, type) => props.actionGenerated("itemClicked", type, item)}></CometChatGroupList>;
//       case "info":
//         return <CometChatUserInfoScreen
//         theme={props.theme}
//         onItemClick={(item, type) => props.actionGenerated("itemClicked", type, item)}></CometChatUserInfoScreen>;
//       default:
//         return null;
//     }

//   }

//   const chatsTabActive = (props.tab === "conversations") ? true : false;
//   const userTabActive = (props.tab === "contacts") ? true : false;
//   const groupsTabActive = (props.tab === "groups") ? true : false;
//   const moreTabActive = (props.tab === "info") ? true : false;

//   return (
//     <React.Fragment>
//       {switchComponent()}
//       <div css={footerStyle()}>
//         <div css={navbarStyle()}>
//           <div css={itemStyle()} onClick={() => props.actionGenerated('tabChanged', 'conversations')}>
//             <span css={itemLinkStyle(chatGreyIcon, chatBlueIcon, chatsTabActive)}></span>
//           </div>
//           <div css={itemStyle()} onClick={() => props.actionGenerated('tabChanged', 'contacts')}>
//             <span css={itemLinkStyle(contactGreyIcon, contactBlueIcon, userTabActive)}></span>
//           </div>
//           <div css={itemStyle()} onClick={() => props.actionGenerated('tabChanged', 'groups')}>
//             <span css={itemLinkStyle(groupGreyIcon, groupBlueIcon, groupsTabActive)}></span>
//           </div>
//           <div css={itemStyle()} onClick={() => props.actionGenerated('tabChanged', 'info')}>
//             <span css={itemLinkStyle(moreGreyIcon, moreBlueIcon, moreTabActive)}></span>
//           </div> 
//         </div>
//       </div>
//     </React.Fragment>
//   );
// }

// export default React.memo(navbar);