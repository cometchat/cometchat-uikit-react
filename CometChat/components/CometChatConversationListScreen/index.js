import React from "react";
import "./style.scss";

import { CometChatManager } from "../../util/controller";

import CometChatConversationList from "../CometChatConversationList";
import CometChatMessageListScreen from "../CometChatMessageListScreen";

class CometChatConversationListScreen extends React.Component {

  state = {
    darktheme: false,
    item: {},
    type: "",
    tab: "conversations"
  }

  changeTheme = (e) => {

    const theme = this.state.darktheme;
    this.setState({darktheme: theme})
  }

  onItemClicked = (item, type) => {

    this.setState({ item: {...item}, type, viewdetail: false })
  }

  viewDetailActionHandler = (action) => {
    
    switch(action) {
      case "blockUser":
        this.blockUser();
      break;
      case "unblockUser":
        this.unblockUser();
      break;
      default:
      break;
    }
  }

  blockUser = () => {

    let usersList = [this.state.item.uid];
    CometChatManager.blockUsers(usersList).then(list => {

        this.setState({item: {...this.state.item, blockedByMe: true}});

    }).catch(error => {
      console.log("Blocking user fails with error", error);
    });

  }

  unblockUser = () => {
    
    let usersList = [this.state.item.uid];
    CometChatManager.unblockUsers(usersList).then(list => {

        this.setState({item: {...this.state.item, blockedByMe: false}});

      }).catch(error => {
      console.log("unblocking user fails with error", error);
    });

  }

  render() {

    let messageScreen = (<h1 className="cp-center-text">Select a chat to start messaging</h1>);
    if(Object.keys(this.state.item).length) {
      messageScreen = (<CometChatMessageListScreen 
        item={this.state.item} 
        tab={this.state.tab}
        type={this.state.type}
        actionGenerated={this.viewDetailActionHandler}>
      </CometChatMessageListScreen>);
    }

    return (
      <div className={"row cometchat-container " + (this.state.darktheme ? "dark" : "light")}>
        <div className="col-lg-3 col-sm-6 col-xs-12 cp-lists-container" >
          <div className="cp-lists">
            <CometChatConversationList onItemClick={this.onItemClicked}></CometChatConversationList>
          </div>
        </div>
        <div className="col-lg-9 col-sm-6 col-xs-12 cp-chat-container">
          {messageScreen}
          <label className="switch">
            <input type="checkbox" onChange={this.changeTheme} />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
    );
  }
}

export default CometChatConversationListScreen;