import {CometChat} from "@cometchat-pro/chat";

import * as enums from "../../../util/enums.js";

export class UserDetailManager {
	userListenerId = "user_detail_" + new Date().getTime();

	attachListeners(callback) {
		CometChat.addUserListener(
			this.userListenerId,
			new CometChat.UserListener({
				onUserOnline: onlineUser => {
					/* when someuser/friend comes online, user will be received here */
					callback(enums.USER_ONLINE, onlineUser);
				},
				onUserOffline: offlineUser => {
					/* when someuser/friend went offline, user will be received here */
					callback(enums.USER_OFFLINE, offlineUser);
				},
			}),
		);
	}

	removeListeners() {
		CometChat.removeUserListener(this.userListenerId);
	}
}