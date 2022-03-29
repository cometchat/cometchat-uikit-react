import React from "react";
import PropTypes from "prop-types";

import { Hooks } from "./hooks";
import { fontHelper } from "../CometChatUserHelper";
import { CometChatUserListItem, CometChatTheme, UserListItemConfiguration } from "../../";

import {
  contactMsgStyle,
  contactMsgTxtStyle,
  contactListStyle,
  contactAlphabetStyle,
  contactMsgImgStyle,
} from "./style";

import reloadIcon from "./resources/spinner.svg";

const UserList = (props) => {

  const loggedInUser = React.useRef(null);
  const userListManager = React.useRef(null);

  const limit = React.useRef(props.limit);
  const searchKeyword = React.useRef(props.searchKeyword);
  const status = React.useRef(props.status);
  const roles = React.useRef(props.roles);
  const friendsOnly = React.useRef(props.friendsOnly);
  const hideBlockedUsers = React.useRef(props.hideBlockedUsers);
  const tags = React.useRef(props.tags);
  const uids = React.useRef(props.uids);

  const [userList, setUserList] = React.useState([]);
  const [decoratorMessage, setDecoratorMessage] = React.useState("loading");
  const [theme, setTheme] = React.useState(new CometChatTheme());

  const userUpdated = (user) => {
    let userlist = [...userList];
    let userKey = userlist.findIndex((u) => u.uid === user.uid);

    if (userKey > -1) {
      let newUserObj = { ...userlist[userKey], ...user };
      userlist.splice(userKey, 1, newUserObj);
      setUserList(userlist);
    }
  };

  const handleUsers = () => {
		getUsers()
			.then(userlist => {
				if (userList.length === 0 && userlist.length === 0) {
					setDecoratorMessage("NO_USERS_FOUND");
				} else {
					setDecoratorMessage("");
				}
				setUserList(oldlist => [...oldlist, ...userlist]);
			})
			.catch(error => {
				props.onErrorCallback(error);
				setDecoratorMessage("SOMETHING_WRONG");
			});
	};

  const handleScroll = (e) => {
    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
      Math.round(e.currentTarget.clientHeight);
    if (bottom) {

      handleUsers();
    }
  };

  //creates component
  const getCustomView = (customView, props) => {
    return React.createElement(customView, props);
  };

  let messageContainer = null;
  if (userList.length === 0 && decoratorMessage.toLowerCase() === "loading") {
    messageContainer = (
      <div
        style={contactMsgStyle(props, theme)}
        className="userlist__decorator-message"
      >
        {props.customView.loading ? (
          getCustomView(props.customView.loading, props)
        ) : (
          <div
            style={contactMsgImgStyle(props, theme)}
            className="decorator-message"
          ></div>
        )}
      </div>
    );
  } else if (
    userList.length === 0 &&
    decoratorMessage.toLowerCase() === "no_users_found"
  ) {
    messageContainer = (
      <div
        style={contactMsgStyle(props, theme)}
        className="userlist__decorator-message"
      >
        {props.customView.empty ? (
          getCustomView(props.customView.empty, props)
        ) : (
          <div
            style={contactMsgTxtStyle(props, theme, decoratorMessage, fontHelper)}
            className="decorator-message"
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
      <div
        style={contactMsgStyle(props, theme)}
        className="userlist__decorator-message"
      >
        {props.customView.error ? (
          getCustomView(props.customView.error, props)
        ) : (
          <p
            style={contactMsgTxtStyle(props, theme, decoratorMessage, fontHelper)}
            className="decorator-message"
          >
            {props.errorText}
          </p>
        )}
      </div>
    );
  }

  const getUsers = () => {
    return new Promise((resolve, reject) => {
      userListManager?.current
        .fetchNextUsers()
        .then((userlist) => resolve(userlist))
        .catch((error) => reject(error));
    });
  };

  const getListItemStyle = () => {
		return {
			width: "100%",
			height: "auto",
			background: "transparent",
			border: `1px solid ${theme.palette.accent200[theme.palette.mode]}`,
			cornerRadius: "0",
			titleColor: theme?.palette?.accent[theme?.palette?.mode],
			titleFont: fontHelper(theme?.typography?.title2),
			subtitleColor: theme.palette.accent400[theme?.palette?.mode],
			subtitleFont: fontHelper(theme?.typography?.subtitle2),
		};
	};

  const getInputData = () => {

    const userListItemConfig = new UserListItemConfiguration();
    return props.configurations?.userListItemConfiguration?.inputData || userListItemConfig?.inputData;
  };

  const getUserOptions = () => {

    const userListItemConfig = new UserListItemConfiguration();
		return props.configurations?.userListItemConfiguration?.userOptions || userListItemConfig?.userOptions;
  }

  let currentLetter = "";
  const users = userList.map(user => {

    let isActive = props.activeUser?.uid === user.uid ? true : false;
    
    const chr = user.name[0].toUpperCase();
    let firstChar = null;
    if (chr !== currentLetter) {
      currentLetter = chr;
      firstChar = (
        <div
          style={contactAlphabetStyle(theme)}
          className="userlist__alphabet-filter"
        >
          {currentLetter}
        </div>
      );
    }

    return (
      <React.Fragment key={user.uid}>
        {firstChar}
        <CometChatUserListItem
          key={user.uid}
          inputData={getInputData()}
          userOptions={getUserOptions()}
          userObject={user}
          style={getListItemStyle()}
          theme={theme}
          isActive={isActive}
          configurations={props.configurations}
        />
      </React.Fragment>
    );
  });

  Hooks(
    props,
    loggedInUser,
    setUserList,
    userListManager,
    userUpdated,
    handleUsers,
    setTheme,
    limit,
    searchKeyword,
    status,
    roles,
    friendsOnly,
    hideBlockedUsers,
    tags,
    uids
  );

  return (
		<div style={contactListStyle(props, theme)} className="cometchat__userlist" onScroll={handleScroll}>
			{messageContainer}
			{users}
		</div>
	);
};

UserList.defaultProps = {
	limit: 30,
	searchKeyword: "",
	status: "",
	roles: [],
	friendsOnly: false,
	hideBlockedUsers: true,
	tags: [],
	uids: [],
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
	loadingIconURL: reloadIcon,
	emptyText: "No users",
	errorText: "Something went wrong",
	hideError: false,
	onErrorCallback: () => {},
	activeUser: {},
	configurations: {},
};

UserList.propTypes = {
	limit: PropTypes.number,
	searchKeyword: PropTypes.string,
	status: PropTypes.string,
	friendsOnly: PropTypes.bool,
	hideBlockedUsers: PropTypes.bool,
	style: PropTypes.object,
	customView: PropTypes.object,
	roles: PropTypes.array,
	tags: PropTypes.array,
	uids: PropTypes.array,
	errorText: PropTypes.string,
	emptyText: PropTypes.string,
	hideError: PropTypes.bool,
	onErrorCallback: PropTypes.func,
	activeUser: PropTypes.object,
	configurations: PropTypes.object,
};

export const CometChatUserList = React.memo(UserList);