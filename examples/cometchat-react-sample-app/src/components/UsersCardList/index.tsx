import { ICardProps } from "../Card";
import Sidebar from "../../assets/sidebar.png";
import ListWrapper from "../../assets/listwrapper.png";
import Details from "../../assets/details.svg";
import { CardList } from "../CardList";

const cardDataList : Omit<ICardProps, "onClick">[] = [
    {
        title: "users with messages",
        description: "CometChatUsersWithMessages is an independent component used to set up a screen that shows the list of users available in your app and gives you the ability to search for a specific user and to start a conversation.",
        imageInfo: {
            url: Sidebar,
            altText: "chat screen"
        }
    },
    {
        title: "users",
        description: "CometChatUsers is an independent component used to set up a screen and display a scrollable list of users available in your app and gives you the ability to search for a specific user.",
        imageInfo: {
            url: ListWrapper,
            altText: "list wrapper"
        }
    },
    {
        title: "user details",
        description: "CometChatDetails component for a user. To learn more about this component tap click on this card.",
        imageInfo: {
            url: Details,
            altText: "details"
        }
    }
];

export function UsersCardList() {
    return (
        <CardList 
            title = "users"
            cardDataList = {cardDataList}
        />
    );
}
