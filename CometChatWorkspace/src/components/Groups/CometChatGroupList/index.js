import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { GroupListManager } from "./controller";

import { CometChatCreateGroup, CometChatGroupListItem }  from "../../Groups";

import * as enums from "../../../util/enums.js";
import { validateWidgetSettings } from "../../../util/common";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

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

import searchIcon from "./resources/search-grey-icon.png";
import navigateIcon from "./resources/navigate.png";
import addIcon from "./resources/creategroup.png";

class CometChatGroupList extends React.PureComponent {
  timeout;
  loggedInUser = null;

  constructor(props) {

    super(props);

    this.state = {
      grouplist: props.grouplist,
      createGroup: false,
      selectedGroup: null,
      lang: props.lang
    }

    this.decoratorMessage = Translator.translate("LOADING", props.lang);
    this.groupListRef = React.createRef();
  }

  componentDidMount() {

    this.GroupListManager = new GroupListManager();
    this.getGroups();
    this.GroupListManager.attachListeners(this.groupUpdated);
  }

  componentDidUpdate(prevProps) {

    const previousItem = JSON.stringify(prevProps.item);
    const currentItem = JSON.stringify(this.props.item);

    //if different group is selected
    if (previousItem !== currentItem) {

      if (Object.keys(this.props.item).length === 0) {

        this.groupListRef.scrollTop = 0;
        this.setState({ selectedGroup: {} });

      } else {

        let grouplist = [...this.state.grouplist];

        //search for user
        let groupKey = grouplist.findIndex(g => g.guid === this.props.item.guid);
        if (groupKey > -1) {

          let groupObj = { ...grouplist[groupKey] };
          this.setState({ selectedGroup: groupObj });
        }
      }
    }

    //if user deletes a group, remove it from chatslist
    if (prevProps.groupToDelete !== this.props.groupToDelete) {

      const groups = [...this.state.grouplist];
      const groupToDelete = this.props.groupToDelete;

      const groupKey = groups.findIndex(group => group.guid === groupToDelete.guid);
      if (groupKey > -1) {

        groups.splice(groupKey, 1);
        this.setState({ grouplist: groups });
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

    if (prevProps.lang !== this.props.lang) {
      this.setState({ lang: this.props.lang });
    }
  }

  componentWillUnmount() {
    this.GroupListManager = null;
  }

  removeGroupFromListOnDeleting = (group) => {

    const groupList = [...this.state.grouplist];
    const groupKey = groupList.findIndex(g => g.guid === group.guid);
    
    if (groupKey > -1) {

      groupList.splice(groupKey, 1);
      this.setState({ grouplist: groupList });
    }
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
        
        let newgroupObj = Object.assign({}, groupObj, group);
        
        grouplist.splice(groupKey, 1, newgroupObj);
        this.setState({ grouplist: grouplist });

      } else {

        let groupObj = { ...grouplist[groupKey] };
        let membersCount = parseInt(group.membersCount);

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

      let membersCount = parseInt(group.membersCount);

      let scope = group.hasOwnProperty("scope") ? group.scope : "";
      let hasJoined = group.hasOwnProperty("hasJoined") ? group.hasJoined : false;
      
      if (options && this.loggedInUser.uid === options.user.uid) {
        scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
        hasJoined = true;
      }

      let newgroupObj = Object.assign({}, groupObj, { membersCount: membersCount, scope: scope, hasJoined: hasJoined });

      grouplist.splice(groupKey, 1, newgroupObj);
      this.setState({ grouplist: grouplist });

    } else {

      let groupObj = { ...group }; 

      let scope = groupObj.hasOwnProperty("scope") ? groupObj.scope : "";
      let hasJoined = groupObj.hasOwnProperty("hasJoined") ? groupObj.hasJoined : false;
      let membersCount = parseInt(groupObj.membersCount);

      if (options && this.loggedInUser.uid === options.user.uid) {
        scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
        hasJoined = true;
      } 

      let newgroupObj = Object.assign({}, groupObj, { membersCount: membersCount, scope: scope, hasJoined: hasJoined });
      
      grouplist.unshift(newgroupObj);
      this.setState({ grouplist: grouplist });
    }
  }

  updateMemberJoined = (group, options) => {

    let grouplist = [...this.state.grouplist];

    //search for group
    let groupKey = grouplist.findIndex((g, k) => g.guid === group.guid);

    if (groupKey > -1) {

      let groupObj = { ...grouplist[groupKey] };

      let scope = groupObj.scope;
      let membersCount = parseInt(group.membersCount);

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

      //if join or leave groups is disabled in chat widget
      if (validateWidgetSettings(this.props.widgetsettings, "join_or_leave_groups") === false) {
        console.log("Group joining disabled in widget settings");
        return false;
      }

      let password = "";
      if(group.type === CometChat.GROUP_TYPE.PASSWORD) {
        password = prompt(Translator.translate("ENTER_YOUR_PASSWORD", this.state.lang));
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

      this.setState({ grouplist: [] });

      this.GroupListManager = new GroupListManager(val);
      this.getGroups();

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

    CometChat.getLoggedinUser().then(user => {

      this.loggedInUser = user;
      this.GroupListManager.fetchNextGroups().then(groupList => {

        if(groupList.length === 0) {
          this.decoratorMessage = Translator.translate("NO_GROUPS_FOUND", this.state.lang);
        }

        this.setState({ grouplist: [...this.state.grouplist, ...groupList] });

      }).catch(error => {

        this.decoratorMessage = Translator.translate("ERROR", this.state.lang);
        console.error("[CometChatGroupList] getGroups fetchNextGroups error", error);
      });

    }).catch(error => {

      this.decoratorMessage = Translator.translate("ERROR", this.state.lang);
      console.log("[CometChatGroupList] getUsers getLoggedinUser error", error);
    });
  }

  createGroupHandler = (flag) => {
    this.setState({"createGroup": flag});
  }

  createGroupActionHandler = (action, group) => {

    if (action === enums.ACTIONS["GROUP_CREATED"]) {

      this.handleClick(group);

      const groupList = [...this.state.grouplist];
      groupList.unshift(group);
      
      this.setState({ grouplist: groupList, createGroup: false });
    }
  }

  render() {

    let messageContainer = null;
    
    if(this.state.grouplist.length === 0) {
      messageContainer = (
        <div css={groupMsgStyle()} className="groups__decorator-message">
          <p css={groupMsgTxtStyle(this.props)} className="decorator-message">{this.decoratorMessage}</p>
        </div>
      );
    }

    const groups = this.state.grouplist.map(group => {
      return (
        <CometChatGroupListItem 
        key={group.guid} 
        theme={this.props.theme}
        group={group} 
        lang={this.state.lang}
        selectedGroup={this.state.selectedGroup}
        clickHandler={this.handleClick} />);
    });

    let creategroup = (<div css={groupAddStyle(addIcon)} title={Translator.translate("CREATE_GROUP", this.state.lang)} onClick={() => this.createGroupHandler(true)}>
      <img src={addIcon} alt={Translator.translate("CREATE_GROUP", this.state.lang)} />
    </div>);

    //if create group is disabled in v1 chat widget
    if (validateWidgetSettings(this.props.config, "group-create") === false) {
      creategroup = null;
    }

    //if create group is disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "create_groups") === false) {
      creategroup = null;
    }

    let closeBtn = (<div css={groupHeaderCloseStyle(navigateIcon, this.props)} className="header__close" onClick={this.handleMenuClose}></div>);
    if (!this.props.hasOwnProperty("enableCloseMenu") || (this.props.hasOwnProperty("enableCloseMenu") && this.props.enableCloseMenu === 0)) {
      closeBtn = null;
    }

    return (
      <div css={groupWrapperStyle()} className="groups">
        <div css={groupHeaderStyle(this.props)} className="groups__header">
          {closeBtn}
          <h4 css={groupHeaderTitleStyle(this.props)} className="header__title" dir={Translator.getDirection(this.state.lang)}>{Translator.translate("GROUPS", this.state.lang)}</h4>
          {creategroup}
        </div>
        <div css={groupSearchStyle()} className="groups__search">
          <input 
          type="text" 
          autoComplete="off" 
          css={groupSearchInputStyle(this.props, searchIcon)}
          className="search__input" 
          placeholder={Translator.translate("SEARCH", this.state.lang)}
          onChange={this.searchGroup} />
        </div>
        {messageContainer}
        <div css={groupListStyle()} className="groups__list" onScroll={this.handleScroll} ref={el => this.groupListRef = el}>{groups}</div>
        <CometChatCreateGroup 
        theme={this.props.theme}
        lang={this.state.lang}
        open={this.state.createGroup} 
        close={() => this.createGroupHandler(false)}
        actionGenerated={this.createGroupActionHandler} />
      </div>
    );
  }
}

// Specifies the default values for props:
CometChatGroupList.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
  grouplist: []
};

CometChatGroupList.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object,
  grouplist: PropTypes.arrayOf(PropTypes.shape(CometChat.Group))
}

export default CometChatGroupList;
