import React from "react";

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";
import { SvgAvatar } from '../../util/svgavatar';

import * as enums from '../../util/enums.js';

import { GroupListManager } from "./controller";

import CometChatCreateGroup from "../CometChatCreateGroup";
import GroupView from "../GroupView";

import "./style.scss";

class CometChatGroupList extends React.Component {
  timeout;
  loggedInUser = null;

  constructor(props) {

    super(props);
    this.state = {
      grouplist: [],
      createGroup: false,
      loading: false
    }
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

        const groupObj = groups[groupKey];
        const newGroupObj = Object.assign({}, groupObj, {hasJoined: false});
        groups.splice(groupKey, 1, newGroupObj);
        this.setState({grouplist: groups});
      }
    }

    if(prevProps.groupToDelete && prevProps.groupToDelete.guid !== this.props.groupToDelete.guid) {
            
      const groups = [...this.state.grouplist];
      const groupKey = groups.findIndex(member => member.guid === this.props.groupToDelete.guid);
      if(groupKey > -1) {

        groups.splice(groupKey, 1);
        this.setState({grouplist: groups});
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
        this.updateGroup(group, undefined, options);
        break;
      case enums.GROUP_MEMBER_KICKED:
        this.updateGroup(group, "decrement", options);
        break;
      case enums.GROUP_MEMBER_BANNED:
        this.updateGroup(group, "decrement", options);
        break;
      case enums.GROUP_MEMBER_UNBANNED:
        this.updateGroup(group, undefined, options);
        break;
      case enums.GROUP_MEMBER_ADDED:
        this.updateGroup(group, "increment", options);
        break;
      case enums.GROUP_MEMBER_LEFT:
        this.updateGroup(group, "decrement");
        break;
      case enums.GROUP_MEMBER_JOINED:
        this.updateGroup(group, "increment");
        break;
      default:
        break;
    }
  }

  updateGroup = (group, operator, options) => {
    
    let grouplist = [...this.state.grouplist];

    //search for group
    let groupKey = grouplist.findIndex((g, k) => g.guid === group.guid);

    if(groupKey > -1) {

      let groupObj = {...grouplist[groupKey]};

      let membersCount = parseInt(groupObj.membersCount);
      let scope = groupObj.scope;
      let hasJoined = groupObj.hasJoined;

      //member added to group / member joined
      if(operator === "increment") {
        membersCount = membersCount + 1;
      } else if(operator === "decrement") {//member kicked, banned / member left
        membersCount = membersCount - 1;
      }

      //if the loggedin user has been kicked from / or added to group / scope is changed
      if(options && this.loggedInUser.uid === options.user.uid) {
        
        if(options.hasOwnProperty('scope')) {
          scope = options.scope;
        } else if(options.hasOwnProperty('hasJoined')) {
          hasJoined = options.hasJoined;
        }
      }
      let newgroupObj = Object.assign({}, groupObj, {membersCount: membersCount, scope: scope, hasJoined: hasJoined});

      grouplist.splice(groupKey, 1, newgroupObj);

      this.setState({ grouplist: grouplist });
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

    if (!group.hasJoined) {

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
          this.setState({grouplist: groups});

          this.props.onItemClick(newGroupObj, 'group');

        } 
        
      }).catch(error => {
        console.log("Group joining failed with exception:", error);
      });

    } else {
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

    this.setState({loading: true});
    new CometChatManager().getLoggedInUser().then(user => {

      this.loggedInUser = user;
      this.GroupListManager.fetchNextGroups().then(groupList => {

        groupList.forEach(group => group = this.setAvatar(group));
        this.setState({ grouplist: [...this.state.grouplist, ...groupList], loading: false });

      }).catch(error => {
        console.error("[CometChatGroupList] getGroups fetchNextGroups error", error);
        this.setState({loading: false});
      });

    }).catch(error => {
      console.log("[CometChatGroupList] getUsers getLoggedInUser error", error);
      this.setState({loading: false});
    });
  }

  createGroupHandler = (flag) => {
    this.setState({"createGroup": flag});
  }

  setAvatar(group) {

    if(!group.getIcon()) {

      const guid = group.getGuid();
      const char = group.getName().charAt(0).toUpperCase();
      group.setIcon(SvgAvatar.getAvatar(guid, char))
    }

  }

  createGroupActionHandler = (action, group) => {

    if(action === "groupCreated") {

      this.setAvatar(group);
      const groupList = [...this.state.grouplist, group];

      this.handleClick(group);
      this.setState({ grouplist: groupList, createGroup: false });
    }
  }

  render() {

    const groups = this.state.grouplist.map((group, key) => {

      return (
        <div id={key} onClick={() => this.handleClick(group)} key={key}>
          <GroupView key={group.guid} group={group}></GroupView>
        </div>
      );

    });

    let addgroup = null;
    if(!this.props.config || (this.props.config && this.props.config["group-create"])) {     
      addgroup = (<div className="ccl-left-panel-head-edit-link" onClick={() => this.createGroupHandler(true)}></div>);
    }

    let closeBtn = (<div className="cc1-left-panel-close" onClick={this.handleMenuClose}></div>);
    if(this.props.hasOwnProperty("enableCloseMenu") && this.props.enableCloseMenu === 0) {
      closeBtn = null;
    }

    return (
      <React.Fragment>
        <div className="ccl-left-panel-head-wrap">
          {closeBtn}
          <h4 className="ccl-left-panel-head-ttl">Groups</h4>
          {addgroup}
        </div>
        <div className="ccl-left-panel-srch-wrap">
          <div className="ccl-left-panel-srch-inpt-wrap">
            <input 
            type="text" 
            autoComplete="off" 
            className="ccl-left-panel-srch" 
            placeholder="Search"
            onChange={this.searchGroup} />
            <input id="searchButton" type="button" className="search-btn" />
          </div>
        </div>
        <div className="group-list-ext-wrap" onScroll={this.handleScroll}>
          {groups}
        </div>
        <CometChatCreateGroup 
        open={this.state.createGroup} 
        close={() => this.createGroupHandler(false)}
        actionGenerated={this.createGroupActionHandler} />
      </React.Fragment>
    );
  }
}

export default CometChatGroupList;
