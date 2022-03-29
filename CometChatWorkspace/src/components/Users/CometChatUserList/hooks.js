import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { UserListManager } from "./controller";

function Hooks(
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
) {

  React.useEffect(() => {

    CometChat.getLoggedinUser()
		.then(user => {

        loggedInUser.current = {...user};
        userListManager.current = new UserListManager(props);
        userListManager.current?.attachListeners(userUpdated);

        setUserList([]);
		handleUsers();

	})
	.catch(error => {
		props.onErrorCallback(error);
	});
    	return () => {
			if (userListManager 
				&& userListManager.current 
				&& userListManager.current.removeUserListener 
				&& typeof userListManager.current.removeUserListener === "function") {
				userListManager.current?.removeUserListener();
			}
    };

  }, []);

  React.useEffect(() => {
	  if (userListManager && userListManager.current) {
			if (limit.current !== props.limit) {
				limit.current = props.limit;
			}

			if (searchKeyword.current !== props.searchKeyword) {
				searchKeyword.current = props.searchKeyword;
			}

			if (hideBlockedUsers.current !== props.hideBlockedUsers) {
				hideBlockedUsers.current = props.hideBlockedUsers;
			}

			if (friendsOnly.current !== props.friendsOnly) {
				friendsOnly.current = props.friendsOnly;
			}

			if (tags.current !== props.tags) {
				tags.current = props.tags;
			}

			if (roles.current !== props.roles) {
				roles.current = props.roles;
			}

			if (status.current !== props.status) {
				status.current = props.status;
			}

			if (uids.current !== props.uids) {
				uids.current = props.uids;
			}

			userListManager.current = new UserListManager(props);
			setUserList([]);
			handleUsers();
		}
  }, [
	props.limit, 
	props.searchKeyword, 
	props.hideBlockedUsers, 
	props.roles, 
	props.friendsOnly, 
	props.status, 
	props.uids, 
	props.tags
]);

  	React.useEffect(() => {
		if (props.theme) {
			setTheme(props.theme);
		}
	}, [props.theme, setTheme]);

}

export { Hooks };