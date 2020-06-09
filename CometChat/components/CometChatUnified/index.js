import React from "react";
import "./style.scss";

import { CometChatManager } from "../../util/controller";

import NavBar from "./NavBar";
import CometChatMessageListScreen from "../CometChatMessageListScreen";

class CometChatUnified extends React.Component {
  
  state = {
    darktheme: false,
    item: {},
    type: "user",
    tab: "contacts",
  }

  changeTheme = (e) => {
    this.setState({
      darktheme: !this.state.darktheme
    })
  }

  navBarAction = (action, type, item) => {
    
    switch(action) {
      case "itemClicked":
        this.itemClicked(item, type);
      break;
      case "tabChanged":
        this.tabChanged(type);
      break;
      case "groupMemberLeft":
        this.appendMessage(item);
      break;
      case "groupMemberJoined":
        this.appendMessage(item);
      break;
      case "userStatusChanged":
        this.updateSelectedUser(item);
      break;
      default:
      break;
    }
  }

  updateSelectedUser = (item) => {

    this.setState({ item: {...item}});
  }

  itemClicked = (item, type) => {
    
    this.setState({ item: {...item}, type });
    
  }

  tabChanged = (tab) => {
    this.setState({tab});
    this.setState({viewdetail: false});
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
      <div className={"row cometchat-container " + (this.state.darktheme ? " dark" : " light")}>
        <div className="col-lg-3 col-sm-6 col-xs-12 cp-lists-container" >
          <div className="cp-lists">
            <NavBar 
            item={this.state.item} 
            tab={this.state.tab} 
            actionGenerated={this.navBarAction}></NavBar>
          </div>
        </div>
        <div className="col-lg-9 col-sm-6 col-xs-12 cp-chat-container">{messageScreen}</div>
      </div>
    );
  }
}

export default CometChatUnified;