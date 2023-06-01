import { ICardProps } from "../Card";
import Sidebar from "../../assets/sidebar.png";
import { CardList } from "../CardList";

const cardDataList : Omit<ICardProps, "onClick">[] = [
    {
        title: "call buttons",
        description: "CometChatCallButtons is an independent component used to initiate 1v1 and direct calling",
        imageInfo: {
            url: Sidebar,
            altText: "sidebar"
        }
    }
];

export function CallsCardList() {
    return (
        <CardList 
            title = "calls"
            cardDataList = {cardDataList}
        />
    );
}
