import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { UserListManager } from "./controller";

function Hooks(
	loggedInUser,
	setUserList,
	userListManager,
	updateUser,
	handleUsers,
	limit,
	searchKeyword,
	status,
	roles,
	friendsOnly,
	hideBlockedUsers,
	tags,
	uids,
	errorHandler
) {
	React.useEffect(() => {
		CometChat.getLoggedinUser()
			.then((user) => {
				loggedInUser.current = { ...user };
				userListManager.current = new UserListManager(
					limit,
					searchKeyword,
					hideBlockedUsers,
					roles,
					friendsOnly,
					status,
					uids,
					tags
				);
				userListManager.current?.attachListeners(updateUser);

				setUserList([]);
				handleUsers();
			})
			.catch((error) => {
				errorHandler(error);
			});
		return () => {
			if (
				userListManager &&
				userListManager.current &&
				userListManager.current.removeUserListener &&
				typeof userListManager.current.removeUserListener === "function"
			) {
				userListManager.current?.removeUserListener();
			}
		};
	}, []);

	React.useEffect(() => {
		if (userListManager && userListManager.current) {
			userListManager.current = new UserListManager(
				limit,
				searchKeyword,
				hideBlockedUsers,
				roles,
				friendsOnly,
				status,
				uids,
				tags
			);
			setUserList([]);
			handleUsers();
		}
	}, [
		limit,
		searchKeyword,
		hideBlockedUsers,
		roles?.length,
		friendsOnly,
		status,
		uids?.length,
		tags?.length,
	]);
}

export { Hooks };
