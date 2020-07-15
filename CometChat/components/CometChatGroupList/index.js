import React from "react";

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";
import { SvgAvatar } from '../../util/svgavatar';

import { GroupListManager } from "./controller";

import CometChatCreateGroup from "../CometChatCreateGroup";
import GroupView from "../GroupView";

import "./style.scss";

class CometChatGroupList extends React.Component {
  timeout;

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
  }

  componentDidUpdate(prevProps, prevState) {

    if(prevProps.groupToLeave && prevProps.groupToLeave.guid !== this.props.groupToLeave.guid) {
      
      const groups = [...this.state.grouplist];
      const IndexFound = groups.findIndex(member => member.guid === this.props.groupToLeave.guid);
      
      if(IndexFound) {

        const found = groups[IndexFound];
        groups.splice(IndexFound, 1);
        found.hasJoined = false;
        this.setState({grouplist: [...groups, found]});
      }
    }

    if(prevProps.groupToDelete && prevProps.groupToDelete.guid !== this.props.groupToDelete.guid) {
            
      const groups = [...this.state.grouplist];
      const IndexFound = groups.findIndex(member => member.guid === this.props.groupToDelete.guid);
      if(IndexFound > -1) {

        groups.splice(IndexFound, 1);
        this.setState({grouplist: [...groups]});
      }
    }

    if(prevProps.groupToUpdate 
    && ((prevProps.groupToUpdate.guid !== this.props.groupToUpdate.guid)
    || (prevProps.groupToUpdate.guid === this.props.groupToUpdate.guid 
      && (prevProps.groupToUpdate.membersCount !== this.props.groupToUpdate.membersCount
      || prevProps.groupToUpdate.scope !== this.props.groupToUpdate.scope)))) {
            
      const groups = [...this.state.grouplist];

      const groupToUpdate = this.props.groupToUpdate;

      let groupIndex = -1, groupFound = {};
      groups.forEach((group, index) => {

          if(group.guid === groupToUpdate.guid) {
            groupIndex = index;
            groupFound = Object.assign({}, group, groupToUpdate, {scope: groupToUpdate["scope"], membersCount: groupToUpdate["membersCount"]});

          }
      });

      const groupList = groups.splice(groupIndex, 1, groupFound);
      this.setState({grouplist: [...groups]});
    }

  }

  componentWillUnmount() {
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

      let password = "";
      if(group.type === CometChat.GROUP_TYPE.PASSWORD) {

        password = prompt("Enter your password");
      } 

      const guid = group.guid;
      const groupType = group.type;
      
      CometChat.joinGroup(guid, groupType, password).then(response => {

        console.log("Group joining success with response", response, "group", group);

        const groups = [...this.state.grouplist];

        let groupIndex = -1, groupFound = {};
        groups.forEach((group, index) => {

          if(group.guid === guid) {
            groupIndex = index;
            groupFound = Object.assign({}, group, response, {"scope": CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT});
          }

        });
        const groupList = groups.splice(groupIndex, 1, groupFound);
        this.setState({grouplist: [...groups]});
        this.props.onItemClick(groupFound, 'group');

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
    new CometChatManager().getLoggedInUser().then(group => {

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

    let loading = null;
    if(this.state.loading) {
      loading = (
        <div className="loading-text">Loading...</div>
      );
    }

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

    return (
      <React.Fragment>
        <div className="ccl-left-panel-head-wrap">
          <h4 className="ccl-left-panel-head-ttl">Groups</h4>
          <div className="cc1-left-panel-close" onClick={this.handleMenuClose}></div>
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
