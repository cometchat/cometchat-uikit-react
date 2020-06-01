import React from "react";
import "./style.scss";

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";
import { SvgAvatar } from '../../util/svgavatar';
import * as enums from '../../util/enums.js';

import { GroupListManager } from "./controller";

import GroupView from "../GroupView";

class CometChatGroupList extends React.Component {
  timeout;

  constructor(props) {

    super(props);
    this.state = {
      grouplist: []
    }

  }

  componentDidMount() {
    this.GroupListManager = new GroupListManager();
    this.getGroups();
    this.GroupListManager.attachListeners(this.groupUpdated.bind(this));

  }

  componentWillUnmount() {
    this.GroupListManager.removeListeners();
    this.GroupListManager = null;
  }
  
  handleScroll = (e) => {
    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
    if (bottom) this.getGroups();
  }

  handleClick = (group) => {

    if(!this.props.onItemClick)
      return;

    if (!group.hasJoined) {
      let GUID = group.guid;
      let password = "";
      let groupType = CometChat.GROUP_TYPE.PUBLIC;

      CometChat.joinGroup(GUID, groupType, password).then(
        group => {
          //this.groupUpdated(group);
          this.props.onItemClick(group, 'group');
        },
        error => {
          console.log("Group joining failed with exception:", error);
        }
      );

    } else {
      this.props.onItemClick(group, 'group');
    }

  }
  
  searchGroup = (e) => {

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    let val = e.target.value;
    this.timeout = setTimeout(() => {

      this.GroupListManager = new GroupListManager(val);
      this.setState({ grouplist: [] }, () => this.getGroups())
    }, 500)

  }

  //callback for group listeners
  groupUpdated(key, message) {

    //if the group is not the selected group
    if(!this.props.item || this.props.item.guid !== message.receiver.guid)
    return false;

    switch(key) {

      case enums.GROUP_MEMBER_JOINED:
        this.markMessagesRead(message);
        this.props.actionGenerated("groupMemberJoined", "group", [message]);
      break;
      case enums.GROUP_MEMBER_LEFT:
        this.markMessagesRead(message);
        this.props.actionGenerated("groupMemberLeft", "group", [message]);
      break;
      default:
      break;
    }
    
  }

  markMessagesRead = (message) => {

    if (!(message.getReadAt() || message.getReadByMeAt())) {

      if (message.getReceiverType() === 'user') {
        CometChat.markAsRead(message.getId().toString(), message.getSender().getUid(), message.getReceiverType());
      } else {
        CometChat.markAsRead(message.getId().toString(), message.getReceiverId(), message.getReceiverType());
      }
    }
  }

  getGroups = () => {

    new CometChatManager().getLoggedInUser().then(group => {

        this.GroupListManager.fetchNextGroups().then(groupList => {

          groupList.forEach(group => group = this.setAvatar(group));
          this.setState({ grouplist: [...this.state.grouplist, ...groupList] });

        }).catch(error => {
          console.error("[CometChatGroupList] getGroups fetchNextGroups error", error);
        });

    }).catch(error => {
      console.log("[CometChatGroupList] getUsers getLoggedInUser error", error);
    });
  }

  setAvatar(group) {

    if(!group.getIcon()) {

      const guid = group.getGuid();
      const char = group.getName().charAt(0).toUpperCase();
      group.setIcon(SvgAvatar.getAvatar(guid, char))
    }

  }

  render() {

    const groups = this.state.grouplist.map((group, key) => {

      return (
        <div id={key} onClick={() => this.handleClick(group)} key={key}>
          <GroupView key={group.guid} group={group}></GroupView>
          <div className="row cp-list-seperator"></div>
        </div>
      );

    });

    return (
      <div className="cp-grouplist-wrapper">
        <p className="cp-contact-list-title font-extra-large">Groups</p>
        <p className="cp-searchbar">
          <input className="font-normal" onChange={this.searchGroup} type="text" placeholder="Search" aria-label="Search" />
        </p>
        <div className="cp-userlist" onScroll={this.handleScroll}>{groups}</div>
      </div>

    );
  }
}

export default CometChatGroupList;