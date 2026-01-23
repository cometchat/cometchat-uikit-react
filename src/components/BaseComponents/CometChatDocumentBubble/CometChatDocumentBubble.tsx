interface DocumentBubbleProps {

    /* url for the banner image used for document bubble. */
    bannerImage: string;

    /* title text for the document bubble. */
    title: string;

    /* url of the document to be shown. */
    URL: string;

    /* description of the document. */
    subtitle: string;

    /* text which is used to display on the button. */
    buttonText: string;

    /* boolean value to toggle styling for sender and receiver message */
    isSentByMe?: boolean;

    /* callback function that triggeres on click of button. */
    onClicked: ((url: string) => void) | undefined;
}

/* 
    CometChatDocumentBubble is a composite component used to display document messages. 
    It is generally used in user or group chats as a wrapper for document messages.
*/
const CometChatDocumentBubble = (props: DocumentBubbleProps) => {
    const {
        title = "",
        URL = "",
        subtitle = "",
        buttonText = "",
        isSentByMe = false,
        onClicked = () => { },
        bannerImage = ""
    } = props;

    return (
        <div className="cometchat">
            <div className={`cometchat-document-bubble ${isSentByMe ? "cometchat-document-bubble-outgoing" : "cometchat-document-bubble-incoming"}`}>
                <div className="cometchat-document-bubble__banner-image">
                    <img src={bannerImage} alt="" />
                </div>
                <div className="cometchat-document-bubble__body">
                    <div
                        className="cometchat-document-bubble__body-icon"
                    >
                    </div>
                    <div className="cometchat-document-bubble__body-content">
                        <div
                            className="cometchat-document-bubble__body-content-name"
                        >
                            <label title={title}>{title}</label>
                        </div>
                        {subtitle?.trim() && subtitle.trim()?.length > 0 ?
                            <div
                                className="cometchat-document-bubble__body-content-description" >
                                <label title={subtitle}>{subtitle}</label>
                            </div> : null}
                    </div>

                </div>

                <div
                    className="cometchat-document-bubble__button"
                    title={buttonText} onClick={() => onClicked(URL)}
                >
                    {buttonText}
                </div>
            </div>
        </div>
    )
}

export { CometChatDocumentBubble };