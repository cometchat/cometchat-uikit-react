import {CometChat} from "@cometchat-pro/chat"

export const groupObject = {
    guid: "guid",
    icon: "icon",
    name: "name",
    type: "type",
    membersCount: "membersCount",
    onlineMembersCount: "onlineMembersCount",
    hasJoined: "hasJoined"
}
export const groupType = {
  private: CometChat.GROUP_TYPE.PRIVATE,
  password: CometChat.GROUP_TYPE.PASSWORD,
  public: CometChat.GROUP_TYPE.PUBLIC,
};

export const groupTypeColorCode = {
    private: "#F7A500",
    password: "#00C86F",
  }
  
export const groupMemberScope = {
	// admin: CometChat.SCOPE.ADMIN,
	// moderator: CometChat.SCOPE.MODERATOR,
	// participant: CometChat.SCOPE.PARTICIPANT
}

export const groupOptions = {
	videocall: "videocall",
	voicecall: "voicecall",
	info: "info"
}