import React from "react";
import "./style.scss";
import CometChatUserList from "../CometChatUserList";
import CometChatGroupList from "../CometChatGroupList";
import CometChatConversationList from "../CometChatConversationList";
import CometChatUserInfoScreen from "../CometChatUserInfoScreen";
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

class NavBar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      src: "",
      activeTab: 'contacts'
    }


  }

  onTabChange(tab) {
    this.setState({
      activeTab: tab
    })

  }
  static getDerivedStateFromProps(props, state) {
    return props;


  }
  render() {
    return (
      <div className="cp-navbar">

        <div className="cp-navbar">

          {(() => {
            switch (this.state.activeTab) {
              case "contacts":
                return <CometChatUserList onItemClick={this.props.onItemSelected}></CometChatUserList>
              case "calls":
                return "calls"
              case "conversations":
                return <CometChatConversationList onItemClick={this.props.onItemSelected}></CometChatConversationList>
              case "groups":
                return <CometChatGroupList onItemClick={this.props.onItemSelected}></CometChatGroupList>
              case "info":
                return <CometChatUserInfoScreen onItemClick={this.props.onItemSelected}></CometChatUserInfoScreen>

              default:
                break;
            }
          })()}
        </div>
        <div className="tab">
          <button onClick={() => this.onTabChange('contacts')}><img src={this.state.activeTab === "contacts" ? peopleBlue : peopleGrey} alt="contacts" /></button>
          <button style={{ display: "none" }} onClick={() => this.onTabChange('calls')}><img src={this.state.activeTab === "calls" ? callBlue : callGrey} alt="calls" /></button>
          <button onClick={() => this.onTabChange('conversations')}><img src={this.state.activeTab === "conversations" ? chatBlue : chatGrey} alt="conversations" /></button>
          <button onClick={() => this.onTabChange('groups')}><img src={this.state.activeTab === "groups" ? groupBlue : groupGrey} alt="groups" /></button>
          <button onClick={() => this.onTabChange('info')}><img src={this.state.activeTab === "info" ? moreBlue : moreGrey} alt="info" /></button>

        </div>
      </div>
    )
  }
}



export default NavBar;
export const navBar=NavBar;

NavBar.defaultProps = {
  src: ""
};

