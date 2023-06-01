import { ICardProps } from "../Card";
import Conversation from "../../assets/conversation.png";
import Avatar from "../../assets/avatar.png";
import Status from "../../assets/status.png";
import Badge from "../../assets/badge.png"; 
import Receipt from "../../assets/receipt.png";
import TextBubble from "../../assets/text-bubble.svg";
import ImageBubble from "../../assets/image-bubble.svg";
import VideoBubble from "../../assets/video-bubble.svg";
import AudioBubble from "../../assets/audio-bubble.svg";
import FileBubble from "../../assets/file-bubble.svg";
import { CardList } from "../CardList";
import { fontHelper } from "uikit-resources-lerna";
import { useContext } from "react";
import { CometChatContext } from "@cometchat-pro/react-ui-kit";

const cardDataList : Omit<ICardProps, "onClick">[] = [
    {
        title: "list item",
        description: "ListItem displays data on a tile and that tile may contain leading, trailing, title and subtitle widgets.",
        imageInfo: {
            url: Conversation,
            altText: "list item"
        }
    },
    {
        title: "avatar",
        description: "CometChatAvatar component displays an image or a user/group avatar with fallback to the first two letters of the user/group name.",
        imageInfo: {
            url: Avatar,
            altText: "avatar"
        }
    },
    {
        title: "status indicator",
        description: "StatusIndicator component indicates whether a user is offline or online.",
        imageInfo: {
            url: Status,
            altText: "status indicator"
        }
    },
    {
        title: "badge",
        description: "CometChatBadgeCount is a custom component which is used to display the unread message count. It can be used in places like the conversation list item.",
        imageInfo: {
            url: Badge,
            altText: "badge"
        }
    },
    {
        title: "receipt",
        description: "CometChatReceipt component renders the receipts such as sending, sent, delivered, read and error state indicator of a message.",
        imageInfo: {
            url: Receipt,
            altText: "receipt"
        }
    },
    {
        title: "text bubble",
        description: "CometChatTextBubble component displays a text message.",
        imageInfo: {
            url: TextBubble,
            altText: "text bubble"
        }
    },
    {
        title: "image bubble",
        description: "CometChatImageBubble component displays a media message containing an image.",
        imageInfo: {
            url: ImageBubble,
            altText: "image"
        }
    },
    {
        title: "video bubble",
        description: "CometChatVideoBubble component displays a media message containing a video.",
        imageInfo: {
            url: VideoBubble,
            altText: "video"
        }
    },
    {
        title: "audio bubble",
        description: "CometChatAudioBubble displays a media message containing an audio.",
        imageInfo: {
            url: AudioBubble,
            altText: "audio"
        }
    },
    {
        title: "file bubble",
        description: "CometChatFileBubble displays a media message containing a file.",
        imageInfo: {
            url: FileBubble,
            altText: "file"
        }
    }
];

export function ViewsCardList() {
    const { theme } = useContext(CometChatContext);

    return (
        <CardList 
            title = "views"
            cardDataList = {cardDataList}
            titleStyle = {{
                font: fontHelper(theme.typography.subtitle2),
                color: theme.palette.getAccent400()
            }}
        />
    );
}
