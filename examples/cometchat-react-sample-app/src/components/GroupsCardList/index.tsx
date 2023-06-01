import { ICardProps } from "../Card";
import Sidebar from "../../assets/sidebar.png";
import ListWrapper from "../../assets/listwrapper.png";
import CreateGroup from "../../assets/create-group.svg";
import PasswordGroup from "../../assets/password-group.svg";
import GroupMembers from "../../assets/group-member.svg";
import AddMembers from "../../assets/add-members.svg";
import TransferOwnership from "../../assets/transfer-ownership-icon.svg";
import BannedMembers from "../../assets/ban-members.svg";
import Details from "../../assets/details.svg";
import { CardList } from "../CardList";

const cardDataList : Omit<ICardProps, "onClick">[] = [
    {
        title: "groups with messages",
        description: "CometChatGroupsWithMessages is an independent component used to set up a screen that shows the list of groups available in your app and gives you the ability to search for a specific group and to start a conversation.",
        imageInfo: {
            url: Sidebar,
            altText: "chat screen"
        }
    },
    {
        title: "groups",
        description: "CometChatGroups is an independent component used to set up a screen that displays the list of groups available in your app and gives you the ability to search for a specific group.",
        imageInfo: {
            url: ListWrapper,
            altText: "list wrapper"
        }
    },
    {
        title: "create group",
        description: "This component is used to create a new group. Groups can be of three types - public, private or password-protected.",
        imageInfo: {
            url: CreateGroup,
            altText: "create group"
        }
    },
    {
        title: "join protected group",
        description: "This component is used to join a password-protected group.",
        imageInfo: {
            url: PasswordGroup,
            altText: "password protected group"
        }
    },
    {
        title: "group members",
        description: "This component is used to view members of a group.",
        imageInfo: {
            url: GroupMembers,
            altText: "group members"
        }
    },
    {
        title: "add members",
        description: "This component is used to add users to a group.",
        imageInfo: {
            url: AddMembers,
            altText: "add members"
        }
    },
    {
        title: "transfer ownership",
        description: "This component is used to transfer ownership of a group from one user to another.",
        imageInfo: {
            url: TransferOwnership,
            altText: "transfer ownership"
        }
    },
    {
        title: "banned members",
        description: "This component is used to view banned members of a group.",
        imageInfo: {
            url: BannedMembers,
            altText: "banned members"
        }
    },
    {
        title: "group details",
        description: "CometChatDetails component for a group.",
        imageInfo: {
            url: Details,
            altText: "details"
        }
    }
];

export function GroupsCardList() {
    return (
        <CardList 
            title = "groups"
            cardDataList = {cardDataList}
        />
    );
}
