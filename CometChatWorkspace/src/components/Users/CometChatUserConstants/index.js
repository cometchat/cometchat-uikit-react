import CometChat from "@cometchat-pro/chat";

const userObject = {
  uid: "uid",
  avatar: "avatar",
  name: "name",
  status: "status",
  role: "role",
  metadata: "metadata",
};

const userStatus = {
  online: CometChat?.USER_STATUS.ONLINE,
  offline: CometChat?.USER_STATUS.OFFLINE,
};

const userStatusColorCode = {
	online: "RGB(0, 200, 111)",
};

const userOptions = {
  videocall: "videocall",
  voicecall: "voicecall",
  info: "info",
};

export { userObject, userStatus, userStatusColorCode, userOptions };
