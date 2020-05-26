import React from "react";
import "./style.scss";

import CometChatUserList from "../../CometChatUserList";
import CometChatGroupList from "../../CometChatGroupList";
import CometChatConversationList from "../../CometChatConversationList";
import CometChatUserInfoScreen from "../../CometChatUserInfoScreen";

import peopleGrey from "./resources/people-grey-icon.svg";
import peopleBlue from "./resources/people-blue-icon.svg";
import callGrey from "./resources/call-grey-icon.svg";
import callBlue from "./resources/call-blue-icon.svg";
import chatGrey from "./resources/chat-grey-icon.svg";
import chatBlue from "./resources/chat-blue-icon.svg";
import groupGrey from "./resources/group-chat-grey-icon.svg";
import groupBlue from "./resources/group-chat-blue-icon.svg";
import moreGrey from "./resources/more-grey-icon.svg";
import moreBlue from "./resources/more-blue-icon.svg";

const navbar = (props) => {

  const switchComponent = () => {

    switch (props.tab) {
      case "contacts":
        return <CometChatUserList 
        item={props.item}
        userStatusChanged={(item) => props.actionGenerated("userStatusChanged", "user", item)}
        onItemClick={(item, type) => props.actionGenerated("itemClicked", type, item)}></CometChatUserList>;
      case "calls":
        return "calls";
      case "conversations":
        return <CometChatConversationList 
        onItemClick={(item, type) => props.actionGenerated("itemClicked", type, item)}></CometChatConversationList>;
      case "groups":
        return <CometChatGroupList 
        item={props.item}
        actionGenerated={props.actionGenerated}
        onItemClick={(item, type) => props.actionGenerated("itemClicked", type, item)}></CometChatGroupList>;
      case "info":
        return <CometChatUserInfoScreen 
        onItemClick={(item, type) => props.actionGenerated("itemClicked", type, item)}></CometChatUserInfoScreen>;
      default:
        return null;
    }

  }

  return (

    <div className="cp-navbar">
      <div className="cp-navbar">{switchComponent()}</div>
      <div className="tab">
        <button onClick={() => props.actionGenerated('tabChanged', 'contacts')}>
          <img src={props.tab === "contacts" ? peopleBlue : peopleGrey} alt="contacts" />
        </button>
        <button style={{ display: "none" }} onClick={() => props.actionGenerated('tabChanged', 'calls')}>
          <img src={props.tab === "calls" ? callBlue : callGrey} alt="calls" />
        </button>
        <button onClick={() => props.actionGenerated('tabChanged', 'conversations')}>
          <img src={props.tab === "conversations" ? chatBlue : chatGrey} alt="conversations" />
        </button>
        <button onClick={() => props.actionGenerated('tabChanged', 'groups')}>
          <img src={props.tab === "groups" ? groupBlue : groupGrey} alt="groups" />
        </button>
        <button onClick={() => props.actionGenerated('tabChanged', 'info')}>
          <img src={props.tab === "info" ? moreBlue : moreGrey} alt="info" />
        </button>
      </div>
    </div>

  )
}

export default React.memo(navbar);