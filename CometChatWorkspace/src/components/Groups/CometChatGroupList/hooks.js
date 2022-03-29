import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { GroupListManager } from "./controller";

export const Hooks = (
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
) => {

  React.useEffect(() => {
    CometChat.getLoggedinUser()
			.then(user => {
				loggedInUser.current = { ...user };
				groupListManager.current = new GroupListManager(props);
				groupListManager.current?.attachListeners(groupCallback);

				setGroupList([]);
				handleGroups();
			})
			.catch(error => {
				props.onErrorCallback(error);
			});
    return () => {

      if (groupListManager 
        && groupListManager.current 
        && groupListManager.current.removeUserListener 
        && typeof groupListManager.current.removeUserListener === "function") {
				groupListManager.current?.removeGroupListener();
			}
      
    };
  }, []);

  React.useEffect(() => {
    const handler = handlers[callbackData?.name];

    if (!handler) {
      return false;
    }

    return handler(...callbackData?.args);
  }, [callbackData]);

  React.useEffect(() => {

		if (groupListManager && groupListManager.current) {

      if(limit.current !== props.limit) {
        limit.current = props.limit;
      }

      if (searchKeyword.current !== props.searchKeyword) {
				searchKeyword.current = props.searchKeyword;
			}

      if (joinedOnly.current !== props.joinedOnly) {
				joinedOnly.current = props.joinedOnly;
			}

      if (tags.current !== props.tags) {
				tags.current = props.tags;
			}

			groupListManager.current = new GroupListManager(props);
      setGroupList([]);
			handleGroups();
		}

	}, [props.limit, props.searchKeyword, props.joinedOnly, props.tags]);

  React.useEffect(() => {
		if (props.theme) {
			setTheme(props.theme);
		}
	}, [props.theme, setTheme]);
};