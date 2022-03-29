import { localize } from "..";
import { groupObject } from "../../../Groups/CometChatGroupConstants";

const GroupListItemConfiguration = function () {
  this.inputData = {
    id: groupObject.guid,
    thumbnail: groupObject.icon,
    status: groupObject.type,
    title: groupObject.name,
    subtitle: (props) => {
      return `${props.membersCount} ${localize("MEMBERS")}`;
    },
  };
  this.groupOptions = [];
};

export { GroupListItemConfiguration };
