import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { GroupListManager } from "./controller";

export const Hooks = (
	loggedInUser,
	handlers,
	setGroupList,
	groupListManager,
	groupCallback,
	callbackData,
	handleGroups,
	limit,
	searchKeyword,
	joinedOnly,
	tags,
	errorHandler
) => {
	React.useEffect(() => {
		CometChat.getLoggedinUser()
			.then((user) => {
				loggedInUser.current = { ...user };
				groupListManager.current = new GroupListManager(
					limit,
					searchKeyword,
					joinedOnly,
					tags
				);
				groupListManager.current?.attachListeners(groupCallback);

				setGroupList([]);
				handleGroups();
			})
			.catch(error => errorHandler(error));
		return () => {
			if (
				groupListManager &&
				groupListManager.current &&
				groupListManager.current.removeUserListener &&
				typeof groupListManager.current.removeUserListener === "function"
			) {
				groupListManager.current?.removeGroupListener();
			}
		};
	}, []);

	React.useEffect(() => {
		const handler = handlers[callbackData?.name];

		if (handler) return handler(...callbackData?.args);
	}, [callbackData]);

	React.useEffect(() => {
		if (groupListManager && groupListManager.current) {
			groupListManager.current = new GroupListManager(
				limit,
				searchKeyword,
				joinedOnly,
				tags
			);

			setGroupList([]);
			handleGroups();
		}
	}, [limit, searchKeyword, joinedOnly, tags?.length]);
};
