import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";
import { SvgAvatar } from '../../util/svgavatar';

import * as enums from '../../util/enums.js';

import { GroupListManager } from "./controller";

import CometChatCreateGroup from "../CometChatCreateGroup";
import GroupView from "../GroupView";

import { theme } from "../../resources/theme";

import {
  groupWrapperStyle,
  groupHeaderStyle,
  groupHeaderCloseStyle,
  groupHeaderTitleStyle,
  groupAddStyle,
  groupSearchStyle,
  groupSearchInputStyle,
  groupMsgStyle,
  groupMsgTxtStyle,
  groupListStyle
} from "./style";

import searchIcon from './resources/search-grey-icon.svg';
import navigateIcon from './resources/navigate_before.svg';
import addIcon from './resources/edit-blue-icon.svg';

class CometChatGroupList extends React.Component {
  timeout;
  loggedInUser = null;
  decoratorMessage = "Loading...";

  constructor(props) {

    super(props);

    this.state = {
      grouplist: [],
      createGroup: false,
      selectedGroup: null
    }

    this.theme = Object.assign({}, theme, this.props.theme);
  }

  componentDidMount() {

    this.GroupListManager = new GroupListManager();
    this.getGroups();
    this.GroupListManager.attachListeners(this.groupUpdated);
  }

  componentDidUpdate(prevProps, prevState) {

    if(prevProps.groupToLeave && prevProps.groupToLeave.guid !== this.props.groupToLeave.guid) {
      
      const groups = [...this.state.grouplist];
      const groupKey = groups.findIndex(member => member.guid === this.props.groupToLeave.guid);
      
      if(groupKey > -1) {

        let groupObj = { ...groups[groupKey] };
        let membersCount = parseInt(groupObj.membersCount) - 1;

        let newgroupObj = Object.assign({}, groupObj, { membersCount: membersCount, hasJoined: false });

        groups.splice(groupKey, 1, newgroupObj);
        this.setState({grouplist: groups});
      }
    }

    if(prevProps.groupToDelete && prevProps.groupToDelete.guid !== this.props.groupToDelete.guid) {
            
      const groups = [...this.state.grouplist];
      const groupKey = groups.findIndex(member => member.guid === this.props.groupToDelete.guid);
      if(groupKey > -1) {

        groups.splice(groupKey, 1);
        this.setState({grouplist: groups});
        if(groups.length === 0) {
          this.decoratorMessage = "No groups found";
        }
      }
    }

    if(prevProps.groupToUpdate 
    && (prevProps.groupToUpdate.guid !== this.props.groupToUpdate.guid 
    || (prevProps.groupToUpdate.guid === this.props.groupToUpdate.guid && (prevProps.groupToUpdate.membersCount !== this.props.groupToUpdate.membersCount || prevProps.groupToUpdate.scope !== this.props.groupToUpdate.scope)))) {
            
      const groups = [...this.state.grouplist];
      const groupToUpdate = this.props.groupToUpdate;

      const groupKey = groups.findIndex(group => group.guid === groupToUpdate.guid);
      if(groupKey > -1) {
        const groupObj = groups[groupKey];
        const newGroupObj = Object.assign({}, groupObj, groupToUpdate, {scope: groupToUpdate["scope"], membersCount: groupToUpdate["membersCount"]});

        groups.splice(groupKey, 1, newGroupObj);
        this.setState({grouplist: groups});
      }
    }

  }

  componentWillUnmount() {
    this.GroupListManager = null;
  }

  groupUpdated = (key, message, group, options) => {
    
    switch(key) {
      case enums.GROUP_MEMBER_SCOPE_CHANGED:
        this.updateMemberChanged(group, options);
        break;
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_LEFT:
        this.updateMemberRemoved(group, options);
        break;
      case enums.GROUP_MEMBER_ADDED:
        this.updateMemberAdded(group, options);
        break;
      case enums.GROUP_MEMBER_JOINED:
        this.updateMemberJoined(group, options);
        break;
      default:
        break;
    }
  }

  updateMemberRemoved = (group, options) => {

    let grouplist = [...this.state.grouplist];

    //search for group
    let groupKey = grouplist.findIndex((g, k) => g.guid === group.guid);

    if (groupKey > -1) {

      if (options && this.loggedInUser.uid === options.user.uid) {

        let groupObj = { ...grouplist[groupKey] };
        let membersCount = parseInt(groupObj.membersCount) - 1;
        
        let newgroupObj = Object.assign({}, groupObj, { membersCount: membersCount, hasJoined: false });
        
        grouplist.splice(groupKey, 1, newgroupObj);
        this.setState({ grouplist: grouplist });

      } else {

        let groupObj = { ...grouplist[groupKey] };
        let membersCount = parseInt(groupObj.membersCount) - 1;

        let newgroupObj = Object.assign({}, groupObj, { membersCount: membersCount });

        grouplist.splice(groupKey, 1, newgroupObj);
        this.setState({ grouplist: grouplist });

      }
    }

  }

  updateMemberAdded = (group, options) => {

    let grouplist = [...this.state.grouplist];

    //search for group
    let groupKey = grouplist.findIndex((g, k) => g.guid === group.guid);

    if (groupKey > -1) {

      let groupObj = { ...grouplist[groupKey] };

      let membersCount = parseInt(groupObj.membersCount) + 1;

      let newgroupObj = Object.assign({}, groupObj, { membersCount: membersCount });

      grouplist.splice(groupKey, 1, newgroupObj);
      this.setState({ grouplist: grouplist });

    } else {

      let groupObj = { ...group };

      let scope = groupObj.hasOwnProperty("scope") ? groupObj.scope : {};
      let hasJoined = groupObj.hasOwnProperty("hasJoined") ? groupObj.hasJoined : false;
      let membersCount = parseInt(groupObj.membersCount) + 1;
      this.setAvatar(groupObj);
      if (options && this.loggedInUser.uid === options.user.uid) {
        scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
        hasJoined = true;
      } 

      let newgroupObj = Object.assign({}, groupObj, { membersCount: membersCount, scope: scope, hasJoined: hasJoined });

      const groupList = [newgroupObj, ...this.state.grouplist];
      this.setState({ grouplist: groupList });
    }
  }

  updateMemberJoined = (group, options) => {

    let grouplist = [...this.state.grouplist];

    //search for group
    let groupKey = grouplist.findIndex((g, k) => g.guid === group.guid);

    if (groupKey > -1) {

      let groupObj = { ...grouplist[groupKey] };

      let scope = groupObj.scope;
      let membersCount = parseInt(groupObj.membersCount) + 1;

      if (options && this.loggedInUser.uid === options.user.uid) {
        scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
      } 

      let newgroupObj = Object.assign({}, groupObj, { membersCount: membersCount, scope: scope });

      grouplist.splice(groupKey, 1, newgroupObj);
      this.setState({ grouplist: grouplist });
    } 
  }

  updateMemberChanged = (group, options) => {

    let grouplist = [...this.state.grouplist];

    //search for group
    let groupKey = grouplist.findIndex((g, k) => g.guid === group.guid);

    if (groupKey > -1) {

      let groupObj = { ...grouplist[groupKey] };
      if (options && this.loggedInUser.uid === options.user.uid) {

        let newgroupObj = Object.assign({}, groupObj, { scope: options.scope });

        grouplist.splice(groupKey, 1, newgroupObj);
        this.setState({ grouplist: grouplist });
      }
    }
  }
  
  handleScroll = (e) => {
    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
    if (bottom) this.getGroups();
  }

  handleClick = (group) => {

    if(!this.props.onItemClick)
      return;

    if (group.hasJoined === false) {

      if(this.props.hasOwnProperty("widgetsettings")
      && this.props.widgetsettings
      && this.props.widgetsettings.hasOwnProperty("main") 
      && this.props.widgetsettings.main.hasOwnProperty("join_or_leave_groups")
      && this.props.widgetsettings.main["join_or_leave_groups"] === false) {
        
        console.log("Group joining disabled in widget settings");
        return false;
      }

      let password = "";
      if(group.type === CometChat.GROUP_TYPE.PASSWORD) {
        password = prompt("Enter your password");
      } 

      const guid = group.guid;
      const groupType = group.type;
      
      CometChat.joinGroup(guid, groupType, password).then(response => {

        console.log("Group joining success with response", response, "group", group);

        const groups = [...this.state.grouplist];

        let groupKey = groups.findIndex((g, k) => g.guid === guid);
        if(groupKey > -1) {

          const groupObj = groups[groupKey];
          const newGroupObj = Object.assign({}, groupObj, response, {"scope":  CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT});

          groups.splice(groupKey, 1, newGroupObj);
          this.setState({grouplist: groups, selectedGroup: newGroupObj});

          this.props.onItemClick(newGroupObj, 'group');
        } 
        
      }).catch(error => {
        console.log("Group joining failed with exception:", error);
      });

    } else {

      this.setState({selectedGroup: group});
      this.props.onItemClick(group, 'group');
    }
  }

  handleMenuClose = () => {

    if(!this.props.actionGenerated) {
      return false;
    }

    this.props.actionGenerated("closeMenuClicked")
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

    new CometChatManager().getLoggedInUser().then(user => {

      this.loggedInUser = user;
      this.GroupListManager.fetchNextGroups().then(groupList => {

        if(groupList.length === 0) {
          this.decoratorMessage = "No groups found";
        }

        groupList.forEach(group => group = this.setAvatar(group));
        this.setState({ grouplist: [...this.state.grouplist, ...groupList] });

      }).catch(error => {

        this.decoratorMessage = "Error";
        console.error("[CometChatGroupList] getGroups fetchNextGroups error", error);
      });

    }).catch(error => {

      this.decoratorMessage = "Error";
      console.log("[CometChatGroupList] getUsers getLoggedInUser error", error);
    });
  }

  createGroupHandler = (flag) => {
    this.setState({"createGroup": flag});
  }

  setAvatar(group) {

    if(group.hasOwnProperty("icon") === false) {

      const guid = group.guid;
      const char = group.name.charAt(0).toUpperCase();
      group.icon = SvgAvatar.getAvatar(guid, char);

    }
    return group;
  }

  createGroupActionHandler = (action, group) => {

    if(action === "groupCreated") {

      this.setAvatar(group);
      const groupList = [group, ...this.state.grouplist];

      this.handleClick(group);
      this.setState({ grouplist: groupList, createGroup: false });
    }
  }

  render() {

    let messageContainer = null;
    
    if(this.state.grouplist.length === 0) {
      messageContainer = (
        <div css={groupMsgStyle()}>
          <p css={groupMsgTxtStyle(this.theme)}>{this.decoratorMessage}</p>
        </div>
      );
    }

    const groups = this.state.grouplist.map((group, key) => {
      return (
      <GroupView 
      key={key} 
      theme={this.theme}
      group={group} 
      selectedGroup={this.state.selectedGroup}
      clickHandler={this.handleClick} />);
    });

    let creategroup = (<div css={groupAddStyle(addIcon)} onClick={() => this.createGroupHandler(true)}></div>);
    if(this.props.hasOwnProperty("config") 
    && this.props.config
    && this.props.config.hasOwnProperty("group-create") 
    && this.props.config["group-create"] === false) {
      creategroup = null;
    }

    if(this.props.hasOwnProperty("widgetsettings") 
    && this.props.widgetsettings
    && this.props.widgetsettings.hasOwnProperty("main") 
    && this.props.widgetsettings.main.hasOwnProperty("create_groups")
    && this.props.widgetsettings.main["create_groups"] === false) {
      creategroup = null;
    }

    let closeBtn = (<div css={groupHeaderCloseStyle(navigateIcon)} onClick={this.handleMenuClose}></div>);
    if (!this.props.hasOwnProperty("enableCloseMenu") || (this.props.hasOwnProperty("enableCloseMenu") && this.props.enableCloseMenu === 0)) {
      closeBtn = null;
    }

    return (
      <div css={groupWrapperStyle()}>
        <div css={groupHeaderStyle(this.theme)}>
          {closeBtn}
          <h4 css={groupHeaderTitleStyle(this.props)}>Groups</h4>
          {creategroup}
        </div>
        <div css={groupSearchStyle()}>
          <input 
          type="text" 
          autoComplete="off" 
          css={groupSearchInputStyle(this.theme, searchIcon)}
          placeholder="Search"
          onChange={this.searchGroup} />
        </div>
        {messageContainer}
        <div css={groupListStyle()} onScroll={this.handleScroll}>{groups}</div>
        <CometChatCreateGroup 
        theme={this.theme}
        open={this.state.createGroup} 
        close={() => this.createGroupHandler(false)}
        actionGenerated={this.createGroupActionHandler} />
      </div>
    );
  }
}

export default CometChatGroupList;