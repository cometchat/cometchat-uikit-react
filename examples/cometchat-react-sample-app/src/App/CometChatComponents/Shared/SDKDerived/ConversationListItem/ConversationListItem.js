import * as styles from "./Styles";
import { CometChatConversationListItem } from "@cometchat-pro/react-ui-kit";

export const ConversationListItem = (props) => {

    const {
        theme
    } = props;

    const conversationObject = {
        conversationType: "user",
        unreadMessageCount: 12,
        conversationWith: {
            uid: "newuser12",
            type: "user",
            name: "Captain America",
        },
        conversationId: "conversation121212",
        lastMessage: {
            sentAt: 1165370496,
            id: "2121",
            text: "Just sent you the documents",
            sender: {
                name: "dummy man",
                avatar: "https://data-us.cometchat.io/assets/images/avatars/captainamerica.png",
                uid: "uid123",
                status: "online"
            },
            sentAt: 20129012109,
            deliveredAt: null,
            readAt: null,
            id: 12120,
            receiverType: "user"
        }
    }

    const inputdata = {
        thumbnail: true,
        title: true,
        subtitle: () => "heyy! nice to meet you.",
        time: true,
        unreadCount: true,
        readReceipt: true
    }

    return (
        <div>
            <div className="description" style={styles.cardDescriptionStyle(theme)}>
                CometChatConversationListItem is a reusable component which is used to display the conversation list item in the conversation list.
            </div>

            <div style={styles.wrapperStyle()}>
                <CometChatConversationListItem
                    conversationInputData={inputdata}
                    conversationObject={conversationObject}
                    theme={theme}
                    style={{
                        border: "none"
                    }}
                />
            </div>
        </div>
    )
}