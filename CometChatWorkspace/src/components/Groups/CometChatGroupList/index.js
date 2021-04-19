import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { GroupListManager } from "./controller";

import { CometChatCreateGroup, CometChatGroupListItem }  from "../../Groups";

import { CometChatContextProvider, CometChatContext } from "../../../util/CometChatContext";
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
  
  item;
  timeout;
  loggedInUser = null;

  static contextType = CometChatContext;

  constructor(props) {

    super(props);

    this.state = {
      grouplist: [],
      createGroup: false,
      lang: props.lang,
    }

    this.contextProviderRef = React.createRef();
    this.decoratorMessage = Translator.translate("LOADING", props.lang);
    this.groupListRef = React.createRef();

    CometChat.getLoggedinUser().then(user => this.loggedInUser = user).catch(error => {
      console.error(error);
    });
  }

  componentDidMount() {

    this.item = (this.getContext().type === CometChat.ACTION_TYPE.TYPE_GROUP) ? this.getContext().item : null;

    this.GroupListManager = new GroupListManager();
    this.getGroups();
    this.GroupListManager.attachListeners(this.groupUpdated);
  }

  componentDidUpdate(prevProps) {

    //if group detail(membersCount) is updated, update grouplist
    if (this.item
    && Object.keys(this.item).length
    && this.getContext().type === CometChat.ACTION_TYPE.TYPE_GROUP && this.item.guid === this.getContext().item.guid
    && this.item.membersCount !== this.getContext().item.membersCount) {

      const groups = [...this.state.grouplist];

      let groupKey = groups.findIndex(group => group.guid === this.getContext().item.guid);
      if (groupKey > -1) {

        const groupObj = groups[groupKey];
        let newGroupObj = Object.assign({}, groupObj, { membersCount: this.getContext().item.membersCount });

        groups.splice(groupKey, 1, newGroupObj);
        this.setState({ grouplist: groups });
      }
    }

    //upon user deleting a group, remove group from group list
    if (this.getContext().deletedGroupId.trim().length) {

      const guid = this.getContext().deletedGroupId.trim();

      const groups = [...this.state.grouplist];
      const groupKey = groups.findIndex(group => group.guid === guid);

      if (groupKey > -1) {

        groups.splice(groupKey, 1);
        this.setState({ grouplist: groups });

      }
    }

    this.item = (this.getContext().type === CometChat.ACTION_TYPE.TYPE_GROUP) ? this.getContext().item : null;

    if (prevProps.lang !== this.props.lang) {
      this.setState({ lang: this.props.lang });
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
    let groupKey = grouplist.findIndex(g => g.guid === group.guid);

    if (groupKey > -1) {

      if (options && this.loggedInUser.uid === options.user.uid) {

        let groupObj = { ...grouplist[groupKey] };
        let membersCount = parseInt(group.membersCount);
        let hasJoined = group.hasJoined;
        
        let newgroupObj = Object.assign({}, groupObj, { membersCount: membersCount, hasJoined: hasJoined });
        
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
    let groupKey = grouplist.findIndex(g => g.guid === group.guid);

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
    let groupKey = grouplist.findIndex(g => g.guid === group.guid);

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
    let groupKey = grouplist.findIndex(g => g.guid === group.guid);

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
        const errorCode = "GROUP_JOINING_DISABLED";
        this.getContext().setToastMessage("warn", errorCode);

        return false;
      }

      let password = "";
      if(group.type === CometChat.GROUP_TYPE.PASSWORD) {
        password = prompt(Translator.translate("ENTER_YOUR_PASSWORD", this.state.lang));
      } 

      const guid = group.guid;
      const groupType = group.type;
      
      CometChat.joinGroup(guid, groupType, password).then(response => {

        if (typeof response === "object" && Object.keys(response).length) {

          this.getContext().setToastMessage("success", "GROUP_JOIN_SUCCESS");

          const groups = [...this.state.grouplist];

          let groupKey = groups.findIndex((g, k) => g.guid === guid);
          if (groupKey > -1) {

            const groupObj = groups[groupKey];
            const newGroupObj = Object.assign({}, groupObj, response, { "scope": CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT });

            groups.splice(groupKey, 1, newGroupObj);
            this.setState({ grouplist: groups });

            this.props.onItemClick(newGroupObj, CometChat.ACTION_TYPE.TYPE_GROUP);
          }

        } else {
          this.getContext().setToastMessage("error", "GROUP_JOIN_FAIL");
        }
        
      }).catch(error => {

        const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
        this.getContext().setToastMessage("error", errorCode);

      });

    } else {

      this.props.onItemClick(group, CometChat.ACTION_TYPE.TYPE_GROUP);
    }
  }

  handleMenuClose = () => {

    if(!this.props.actionGenerated) {
      return false;
    }

    this.props.actionGenerated(enums.ACTIONS["TOGGLE_SIDEBAR"]);
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

      if (message.getReceiverType() === CometChat.RECEIVER_TYPE.USER) {
        CometChat.markAsRead(message.getId().toString(), message.getSender().getUid(), message.getReceiverType());
      } else {
        CometChat.markAsRead(message.getId().toString(), message.getReceiverId(), message.getReceiverType());
      }
    }
  }

  getGroups = () => {

    this.GroupListManager.fetchNextGroups().then(groupList => {

      if(groupList.length === 0) {
        this.decoratorMessage = Translator.translate("NO_GROUPS_FOUND", this.state.lang);
      }

      this.setState({ grouplist: [...this.state.grouplist, ...groupList] });

    }).catch(error => {

      this.decoratorMessage = Translator.translate("ERROR", this.state.lang);

      const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
      this.getContext().setToastMessage("error", errorCode);

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

  getContext = () => {

    if (this.props._parent.length) {
      return this.context;
    } else {
      return this.contextProviderRef.state;
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

      let selectedGroup = (this.getContext().type === CometChat.ACTION_TYPE.TYPE_GROUP && this.getContext().item.guid === group.guid) ? group : null;

      return (
        <CometChatGroupListItem 
        key={group.guid} 
        theme={this.props.theme}
        group={group} 
        lang={this.state.lang}
        selectedGroup={selectedGroup}
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
    if (this.getContext() && Object.keys(this.getContext().item).length === 0) {
      closeBtn = null;
    }

    const groupListTemplate = (
      <React.Fragment>
        <div css={groupWrapperStyle(this.props)} className="groups">
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
        </div>
        <CometChatCreateGroup
          theme={this.props.theme}
          lang={this.state.lang}
          open={this.state.createGroup}
          close={() => this.createGroupHandler(false)}
          actionGenerated={this.createGroupActionHandler} />
      </React.Fragment>
    );

    let groupListWrapper = (groupListTemplate);
    //if used as a standalone component, add errorboundary and context provider
    if(this.props._parent === "") {

      groupListWrapper = (
        <CometChatContextProvider ref={el => this.contextProviderRef = el} >
          {groupListTemplate}
        </CometChatContextProvider>
      );
    }

    return (groupListWrapper);
  }
}

// Specifies the default values for props:
CometChatGroupList.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
  onItemClick: () => {},
  _parent: ""
};

CometChatGroupList.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object,
  onItemClick: PropTypes.func,
  _parent: PropTypes.string
}

export default CometChatGroupList;
