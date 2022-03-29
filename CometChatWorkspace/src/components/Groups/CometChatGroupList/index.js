import React, { useState } from "react";
import PropTypes from "prop-types";

import { fontStyle } from "../CometChatGroupHelper";
import { CometChatGroupListItem, CometChatTheme, GroupListItemConfiguration } from "../../";

import { Hooks } from "./hooks";

import {
  groupMsgStyle,
  groupMsgImgStyle,
  groupMsgTxtStyle,
  groupListStyle,
} from "./style";

import loadingIcon from "./resources/spinner.svg";

/**
 *
 * CometChatGroupList component retrieves the latest list of groups that a CometChat logged-in user has been a part of.
 * The state of the component is communicated via 3 states i.e empty, loading and error
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */

const GroupList = (props) => {

  const loggedInUser = React.useRef(null);
  const groupListManager = React.useRef(null);

  const limit = React.useRef(props.limit);
  const searchKeyword = React.useRef(props.searchKeyword);
  const joinedOnly = React.useRef(props.joinedOnly);
  const tags = React.useRef(props.tags);

  const [groupList, setGroupList] = React.useState([]);
  const [callbackData, setCallbackData] = React.useState(null);
  const [decoratorMessage, setDecoratorMessage] = React.useState("loading");
  
  const [theme, setTheme] = useState(new CometChatTheme());

  // Callback received when user updates the group
  const groupCallback = (listenerName, ...args) => {
    setCallbackData({ name: listenerName, args: [...args] });
  };

  /**
   *
   * Listener callback when a member is kicked from / has left the group
   */
  const handleGroupMemberRemoval = (...options) => {
    const removedUser = options[1];
    const group = options[3];

    let grouplist = [...groupList];

    //search for group
    let groupKey = grouplist.findIndex((g) => g.guid === group.guid);

    if (groupKey > -1) {
      if (loggedInUser?.uid === removedUser.uid) {
        let groupObject = { ...grouplist[groupKey] };
        let newGroupObject = Object.assign({}, groupObject, {
          hasJoined: false,
        });

        grouplist.splice(groupKey, 1, newGroupObject);
        setGroupList(grouplist);
      } else {
        let newGroupObject = Object.assign({}, group);
        grouplist.splice(groupKey, 1, newGroupObject);
        setGroupList(grouplist);
      }
    }
  };

  /**
   *
   * Listener callback when a member is banned from the group
   */
  const handleGroupMemberBan = (...options) => {
    const removedUser = options[1];
    const group = options[3];
    let grouplist = [...groupList];
    let groupKey = grouplist.findIndex((g) => g.guid === group.guid);

    if (groupKey > -1) {
      /**
       * If the loggedin user is banned from the group, remove the group from the group list
       */
      if (loggedInUser?.uid === removedUser.uid) {
        let groupObject = { ...grouplist[groupKey] };
        let newGroupObject = Object.assign({}, groupObject);

        grouplist.splice(groupKey, 1, newGroupObject);
        setGroupList(grouplist);
      } else {
        let newGroupObject = Object.assign({}, group);
        grouplist.splice(groupKey, 1, newGroupObject);
        setGroupList(grouplist);
      }
    }
  };

  /**
   *
   * Listener callback when a user joins/added to the group
   */
  const handleGroupMemberAddition = (...options) => {
    const newUser = options[1];
    const group = options[3];
    let grouplist = [...groupList];

    //search for group
    let groupKey = grouplist.findIndex((g) => g.guid === group.guid);
    if (groupKey > -1) {
      if (loggedInUser?.uid === newUser.uid) {
        let groupObject = { ...grouplist[groupKey] };
        let newgroupObject = Object.assign({}, groupObject, {
          hasJoined: true,
        });

        grouplist.splice(groupKey, 1, newgroupObject);
        setGroupList(grouplist);
      } else {
        grouplist.splice(groupKey, 1, group);
        setGroupList(grouplist);
      }
    } else {
      grouplist.unshift(group);
      setGroupList(grouplist);
    }
  };

  /**
   *
   * Listener callback when a group member scope is updated
   */
  const handleGroupMemberScopeChange = (...options) => {
    let grouplist = [...groupList];

    const user = options[1];
    const newScope = options[2];
    const group = options[4];

    //search for group
    let groupKey = grouplist.findIndex((g) => g.guid === group.guid);

    if (groupKey > -1) {
      let groupObject = { ...grouplist[groupKey] };
      if (loggedInUser?.uid === user.uid) {
        let newgroupObject = Object.assign({}, groupObject, {
          scope: newScope,
        });

        grouplist.splice(groupKey, 1, newgroupObject);

        setGroupList(grouplist);
      } else {
        let groupObject = { ...grouplist[groupKey] };
        let newgroupObject = Object.assign({}, groupObject);
        grouplist.splice(groupKey, 1, newgroupObject);
        setGroupList(grouplist);
      }
    }
  };

  const handlers = {
    onMemberAddedToGroup: handleGroupMemberAddition,
    onGroupMemberJoined: handleGroupMemberAddition,
    onGroupMemberKicked: handleGroupMemberRemoval,
    onGroupMemberLeft: handleGroupMemberRemoval,
    onGroupMemberBanned: handleGroupMemberBan,
    onGroupMemberScopeChanged: handleGroupMemberScopeChange,
  };

  const handleGroups = () => {
    getGroups()
			.then(grouplist => {
				if (groupList.length === 0 && grouplist.length === 0) {
					setDecoratorMessage("NO_GROUPS_FOUND");
				} else {
					setDecoratorMessage("");
				}
				//setGroupList([...groupList, ...grouplist]);
        setGroupList(oldlist => [...oldlist, ...grouplist]);
			})
			.catch(error => {
				props.onErrorCallback(error);
				setDecoratorMessage("SOMETHING_WRONG");
			});
  }

  const getGroups = () => {
		return new Promise((resolve, reject) => {
			groupListManager?.current
				.fetchNextGroups()
				.then(grouplist => resolve(grouplist))
				.catch(error => reject(error));
		});
	};

  // Handle Scroll
  const handleScroll = (e) => {
    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
      Math.round(e.currentTarget.clientHeight);
    if (bottom) {

      handleGroups();
    }
  };
  //  Handling Custom Error View
  const getCustomView = (customView) => {
    return React.createElement(customView, props);
  };

  let messageContainer = null;
  if (groupList.length === 0 && decoratorMessage.toLowerCase() === "loading") {
    messageContainer = (
			<div style={groupMsgStyle(props)} className="grouplist__decorator-message">
				{props.customView.loading ? (
					getCustomView(props.customView.loading, props)
				) : (
					<div style={groupMsgImgStyle(props, theme)} className="decorator-message">
					</div>
				)}
			</div>
		);
  } else if (
    groupList.length === 0 &&
    decoratorMessage.toLowerCase() === "no_groups_found"
  ) {
    messageContainer = (
      <div style={groupMsgStyle(props)} className='grouplist__decorator-message'>
        {props.customView.empty ? (
          getCustomView(props.customView.empty, props)
        ) : (
          <div
            style={groupMsgTxtStyle(props, fontStyle, theme, decoratorMessage)}
            className='decorator-message'
          >
            {props.emptyText}
          </div>
        )}
      </div>
    );
  } else if (
    !props.hideError &&
    decoratorMessage.toLowerCase() === "something_wrong"
  ) {
    messageContainer = (
      <div style={groupMsgStyle(props)} className='grouplist__decorator-message'>
        {props.customView.error ? (
          getCustomView(props.customView.error, props)
        ) : (
          <p
            style={groupMsgTxtStyle(props, fontStyle, theme, decoratorMessage)}
            className='decorator-message'
          >
            {props.errorText}
          </p>
        )}
      </div>
    );
  }

  const getListItemStyle = () => {
    return {
			width: "100%",
			height: "auto",
			background: "transparent",
			border: "1px solid " + theme?.palette?.accent200[theme?.palette?.mode],
			cornerRadius: "0",
			titleColor: theme?.palette?.accent[theme?.palette?.mode],
			titleFont: fontStyle(theme?.typography?.title2),
			subtitleColor: theme?.palette?.accent600[theme?.palette?.mode],
			subtitleFont: fontStyle(theme?.typography?.subtitle2),
		};
  }

  const getInputData = () => {

		const groupListItemConfig = new GroupListItemConfiguration();
		return props.configurations?.groupListItemConfiguration?.inputData || groupListItemConfig.inputData;
	};

	const getGroupOptions = () => {
		const groupListItemConfig = new GroupListItemConfiguration();
		return props.configurations?.groupListItemConfiguration?.groupOptions || groupListItemConfig.groupOptions;
	};


  Hooks(
    props,
    loggedInUser,
    handlers,
    setGroupList,
    groupListManager,
    groupCallback,
    callbackData,
    setTheme,
    handleGroups,
    limit,
    searchKeyword,
    joinedOnly,
    tags,
  );

  // Group Mapping
  const groups = groupList.map((group) => {
    let isActive = props.activeGroup?.guid === group.guid ? true : false;

    return (
			<CometChatGroupListItem
				key={group.guid}
				inputData={getInputData()}
				groupOptions={getGroupOptions()}
				groupObject={group}
				style={getListItemStyle()}
				theme={theme}
				isActive={isActive}
				configurations={props.configurations}
			/>
		);
  });

  return (
      <div
        style={groupListStyle(props, theme)}
        className='cometchat__grouplist'
        onScroll={handleScroll}
        >
        {messageContainer}
        {groups}
      </div>
  );
};

GroupList.defaultProps = {
	limit: 30,
	searchKeyword: "",
	joinedOnly: false,
	tags: [],
	style: {
		width: "100%",
		height: "100%",
		background: "",
		border: "",
		cornerRadius: "0",
		loadingIconTint: "",
		emptyTextFont: "",
		emptyTextColor: "",
		errorTextFont: "",
		errorTextColor: "",
	},
	customView: {
		loading: "",
		empty: "",
		error: "",
	},
	loadingIconURL: loadingIcon,
	emptyText: "No groups",
	errorText: "Something went wrong",
	hideError: null,
	onErrorCallback: () => {},
	activeGroup: {},
	configurations: {},
};

GroupList.propTypes = {
	limit: PropTypes.number,
	searchKeyword: PropTypes.string,
	joinedOnly: PropTypes.bool,
	tags: PropTypes.array,
	style: PropTypes.object,
	customView: PropTypes.object,
	hideError: PropTypes.bool,
	onErrorCallback: PropTypes.func,
};

export const CometChatGroupList = React.memo(GroupList);