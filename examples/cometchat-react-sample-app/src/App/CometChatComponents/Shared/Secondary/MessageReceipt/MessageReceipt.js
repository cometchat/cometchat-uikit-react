import * as styles from "./Styles";
import { CometChatMessageReceipt } from "@cometchat-pro/react-ui-kit";
import messageWaitIcon from "../../../../assets/wait.svg";
import messageSentIcon from "../../../../assets/message-sent.svg";
import messageDeliveredIcon from "../../../../assets/message-delivered.svg";
import messageReadIcon from "../../../../assets/message-read.svg";
import messageErrorIcon from "../../../../assets/warning-small.svg";

export const MessageReceipt = (props) => {

    const {
        theme
    } = props;

    const errorMessage = {
        error: "something went wrong"
    }
    const sentMessage = {
        sentAt: 20129012109,
        deliveredAt: null,
        readAt: null,
        id: 12120,
        receiverType: "user"
    }
    const progressMessage = {
        getMuid: "12121212",
        sentAt: 0,
        readAt: 0,
        id: 0,
        deliveredAt: 0,
        receiverType: "user"

    }
    const deliveredMessage = {
        deliveredAt: 20129012109,
        sentAt: 0,
        readAt: 0,
        id: 12120,
        receiverType: "user"
    }
    const readMessage = {
        deliveredAt: 0,
        readAt: 20129012109,
        sentAt: 0,
        id: 12120,
        receiverType: "user"
    }

    return (
        <div>
            <div className="description" style={styles.cardDescriptionStyle(theme)}>
                CometChatMessageReceipt component renders the receipts such as sending, sent, delivered, read and error state indicator of a message.
            </div>
            <div className="container" style={styles.container()}>
                <div className="cards" style={styles.cardStyle(theme)}>
                    <div className="card__title" style={styles.sectionHeaderStyle(theme)}>Progress State</div>
                    <div className="receipt__icon" style={styles.iconStyle(theme)}>
                        <CometChatMessageReceipt
                            messageWaitIcon={messageWaitIcon}
                            messageObject={progressMessage}
                        />
                    </div>
                </div>

                <div className="cards" style={styles.cardStyle(theme)}>
                    <div className="card__title" style={styles.sectionHeaderStyle(theme)}>Sent Receipt</div>
                    <div className="receipt__icon" style={styles.iconStyle(theme)}>
                        <CometChatMessageReceipt
                            messageSentIcon={messageSentIcon}
                            messageObject={sentMessage}
                        />
                    </div>
                </div>

                <div className="cards" style={styles.cardStyle(theme)}>
                    <div className="card__title" style={styles.sectionHeaderStyle(theme)}>Delivered Receipt</div>
                    <div className="receipt__icon" style={styles.iconStyle(theme)}>
                        <CometChatMessageReceipt
                            messageDeliveredIcon={messageDeliveredIcon}
                            messageObject={deliveredMessage}
                        />
                    </div>
                </div>

                <div className="cards" style={styles.cardStyle(theme)}>
                    <div className="card__title" style={styles.sectionHeaderStyle(theme)}>Read Receipt</div>
                    <div className="receipt__icon" style={styles.iconStyle(theme)}>
                        <CometChatMessageReceipt
                            messageReadIcon={messageReadIcon}
                            messageObject={readMessage}
                        />
                    </div>
                </div>

                <div className="cards" style={styles.cardStyle(theme)}>
                    <div className="card__title" style={styles.sectionHeaderStyle(theme)}>Error State</div>
                    <div className="receipt__icon" style={styles.iconStyle(theme)}>
                        <CometChatMessageReceipt
                            messageErrorIcon={messageErrorIcon}
                            messageObject={errorMessage}
                        />
                    </div>
                </div>
            </div>
        </div >
    )
}