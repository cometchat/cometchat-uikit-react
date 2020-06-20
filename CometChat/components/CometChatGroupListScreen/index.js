import React from "react";
import classNames from "classnames";

import "./style.scss";

import { CometChatManager } from "../../util/controller";

import CometChatGroupList from "../CometChatGroupList";
import CometChatMessageListScreen from "../CometChatMessageListScreen";
import CometChatGroupDetail from "../CometChatGroupDetail";

class CometChatGroupListScreen extends React.Component {

  state = {
    darktheme: false,
    viewdetailscreen: false,
    item: {},
    type: "group",
    tab: "groups"
  }

  changeTheme = (e) => {

    const theme = this.state.darktheme;
    this.setState({darktheme: !theme});

  }

  onItemClicked = (item, type) => {

    this.setState({ item: {...item}, type, viewdetailscreen: false });
  }

  groupScreenAction = (action, type, item) => {

    switch(action) {
      case "groupMemberLeft":
        this.appendMessage(item);
      break;
      case "groupMemberJoined":
        this.appendMessage(item);
      break;
      default:
      break;
    }
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
    //let viewdetail = !this.state.viewdetailscreen;
    //this.setState({viewdetailscreen: viewdetail});
  }

  render() {

    let detailScreen;
    if(this.state.viewdetailscreen) {

      detailScreen = (
        <div className="ccl-right-panel">
        <CometChatGroupDetail
          item={this.state.item} 
          type={this.state.type}
          actionGenerated={this.viewDetailActionHandler} />
        </div>
      );
      
    }

    let messageScreen = (<h1 className="cp-center-text">Select a chat to start messaging</h1>);
    if(Object.keys(this.state.item).length) {
      messageScreen = (<CometChatMessageListScreen 
        item={this.state.item} 
        tab={this.state.tab}
        type={this.state.type}
        actionGenerated={this.viewDetailActionHandler}>
      </CometChatMessageListScreen>);
    }

    const wrapperClassName = classNames({
      "page-int-wrapper": true,
      "dark": this.state.darktheme
    });

    return (

      <div className="page-wrapper">
        <div className={wrapperClassName}>
          <div className="ccl-left-panel">
            <CometChatGroupList
            item={this.state.item} 
            actionGenerated={this.groupScreenAction}
            onItemClick={this.onItemClicked} />
          </div>
          <div className="ccl-center-panel ccl-chat-center-panel">{messageScreen}</div>
          {detailScreen}
        </div>
      </div>
    );
  }
}

export default CometChatGroupListScreen;