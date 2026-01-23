import { useEffect } from "react";
import placeholderIcon from "../../../assets/image_placeholder.png"
import { useCometChatImageBubble } from "./useCometChatImageBubble";

interface ImageBubbleProps {
    /* URL of the image to be shown. */
    src: string;
    /* image to be shown as the placeholder. */
    placeholderImage?: string;
    /* callback which is triggered on click of the image. */
    onImageClicked?: (input: { src: string }) => void;
    /* boolean to toggle bubble styling. */
    isSentByMe?: boolean;
    /* boolean flag to hide the placeholder image while loading. */
    disableLoadingState?: boolean;
}
/*
    CometChatImageBubble is a generic component used to display images. It is generally used for image messages in chat.
    It accepts the URL of the image to be shown and a callback function that is triggered when the image is clicked.
    It also accepts a placeholderImage input for the default image and a caption to be displayed with the image.
*/
const CometChatImageBubble = (props: ImageBubbleProps) => {
    const {
        src = "",
        placeholderImage = placeholderIcon,
        onImageClicked = () => { },
        isSentByMe = true,
        disableLoadingState = false
    } = props;

    const { image, updateImage } = useCometChatImageBubble({ src, placeholderImage });

    useEffect(() => {
        if (!disableLoadingState) {
            updateImage();
        }
    }, [disableLoadingState]);

    const getImageBubbleView = () => {
        return (
            <div className={`cometchat-image-bubble ${isSentByMe ? "cometchat-image-bubble-outgoing" : "cometchat-image-bubble-incoming"}`} onClick={() => onImageClicked({ src })}>
                <img className="cometchat-image-bubble__body" src={disableLoadingState ? src : image} />
            </div >
        )
    }

    return (
        <div className="cometchat">
            {getImageBubbleView()}
        </div>
    )
}

export { CometChatImageBubble };
