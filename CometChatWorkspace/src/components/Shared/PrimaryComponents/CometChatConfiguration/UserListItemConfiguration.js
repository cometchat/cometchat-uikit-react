import { userObject, userStatus } from "../../../Users/CometChatUserConstants";

const UserListItemConfiguration = function () {
  
  this.userStatus = { ...userStatus };

  this.inputData = {
		uid: userObject.uid,
		thumbnail: userObject.avatar,
		status: userObject.status,
		title: userObject.name,
	};

  this.userOptions = [];

};

export { UserListItemConfiguration };
