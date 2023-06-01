import { ICardProps } from "../Card";
import Sidebar from "../../assets/sidebar.png";
import ListWrapper from "../../assets/listwrapper.png";
import { CardList } from "../CardList";

const cardDataList : Omit<ICardProps, "onClick">[] = [
    {
        title: "conversations with messages",
        description: "CometChatConversationsWithMessages is an independent component used to set up a screen that shows the recent conversations and allows you to send a message to the user or group from the list.",
        imageInfo: {
            url: Sidebar,
            altText: "chat screen"
        }
    },
    {
        title: "conversations",
        description: "CometChatConversations is an independent component used to set up a screen that shows the recent conversations alone.",
        imageInfo: {
            url: ListWrapper,
            altText: "list wrapper"
        }
    }
];

export function ChatsCardList() {
    return (
        <CardList 
            title = "chats"
            cardDataList = {cardDataList}
        />
    );
}
