import React from "react";
import "./style.scss";

import { CometChatManager } from "../../util/controller";

import NavBar from "./NavBar";
import CometChatMessageListScreen from "../CometChatMessageListScreen";
import CometChatUserDetail from "../CometChatUserDetail";
import CometChatGroupDetail from "../CometChatGroupDetail";

class CometChatUnified extends React.Component {
  
  state = {
    darktheme: false,
    viewdetailscreen: false,
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
    
    this.setState({ item: {...item}, type, viewdetailscreen: false });
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
      case "viewDetail":
        this.toggleDetailView();
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

  toggleDetailView = () => {

    if(this.state.type === "user") {
      let viewdetail = !this.state.viewdetailscreen;
      this.setState({viewdetailscreen: viewdetail});
    }
  }
  
  render() {

    let detailScreen;
    if(this.state.viewdetailscreen) {

      if(this.state.type === "user") {

        detailScreen = (
          <div className="ccl-right-panel">
            <CometChatUserDetail
              item={this.state.item} 
              type={this.state.type}
              actionGenerated={this.viewDetailActionHandler} />
          </div>);

      } else if (this.state.type === "group") {

        detailScreen = (
          <div className="ccl-right-panel">
          <CometChatGroupDetail
            item={this.state.item} 
            type={this.state.type}
            actionGenerated={this.viewDetailActionHandler} />
          </div>
        );
      }
    }

    let messageScreen = (<h1>Select a chat to start messaging</h1>);
    if(Object.keys(this.state.item).length) {
      messageScreen = (<CometChatMessageListScreen 
        item={this.state.item} 
        tab={this.state.tab}
        type={this.state.type}
        actionGenerated={this.viewDetailActionHandler}>
      </CometChatMessageListScreen>);
    }
    
    return (
      <div className="page-wrapper">
        <div className="page-int-wrapper">
          <div className="ccl-left-panel">
            <NavBar 
              item={this.state.item} 
              tab={this.state.tab} 
              actionGenerated={this.navBarAction} />
          </div>
          <div className="ccl-center-panel ccl-chat-center-panel">{messageScreen}</div>
          {detailScreen}
        </div>
        
      </div>
    );
  }
}

export default CometChatUnified;