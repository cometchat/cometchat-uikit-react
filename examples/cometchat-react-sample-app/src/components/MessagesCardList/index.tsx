import { ICardProps } from "../Card";
import Sidebar from "../../assets/sidebar.png";
import ListWrapper from "../../assets/listwrapper.png";
import List from "../../assets/list.png";
import Composer from "../../assets/composer.png";
import { CardList } from "../CardList";

const cardDataList : Omit<ICardProps, "onClick">[] = [
    {
        title: "messages",
        description: "CometChatMessages is an independent component that is used to handle messages for users and groups.",
        imageInfo: {
            url: Sidebar,
            altText: "chat screen"
        }
    },
    {
        title: "message header",
        description: "CometChatMessageHeader is an independent component that displays the user or group information using SDK's user or group object.",
        imageInfo: {
            url: ListWrapper,
            altText: "list wrapper"
        }
    },
    {
        title: "message list",
        description: "CometChatMessageList displays a list of messages and handles real-time operations.",
        imageInfo: {
            url: List,
            altText: "list"
        }
    },
    {
        title: "message composer",
        description: "CometChatMessageComposer is an independent and a critical component that allows users to compose and send various types of messages such as text, image, video and custom messages.",
        imageInfo: {
            url: Composer,
            altText: "composer"
        }
    }
];

export function MessagesCardList() {
    return (
        <CardList 
            title = "messages"
            cardDataList = {cardDataList}
        />
    );
}
