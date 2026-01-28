
interface BaseProps {
    /** Name used for displaying initials in the avatar. */
    name?: string;
    /** URL of the avatar image to be displayed. */
    image?: string;
    /** Optional click handler for the avatar. */
    onClick?: () => void;
    
    /** Disable pointer cursor even when click handler is present. */
    disablePointer?: boolean;
}
type CometChatAvatarProps = BaseProps & { name: string } | BaseProps & { image: string }

/*
    The CometChatAvatar component is designed to display an avatar, which can be either an image or initials derived from a name. 
    If an image URL is provided, the component displays the image as the avatar. 
    If a name is provided and no image URL is given, the component generates an avatar using the initials of the name.
*/
const CometChatAvatar = (props: CometChatAvatarProps) => {
    const {
        image = "",
        name = "",
        onClick,
        disablePointer
    } = props;

    const splitName = name.split(" ");
    const hasClickHandler = typeof onClick === "function";
    const isInteractive = hasClickHandler && !disablePointer;

    return (
        <div className="cometchat" style={{
            height: "inherit",
            width: "inherit",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
        }}>
            <div
                className="cometchat-avatar"
                onClick={isInteractive ? onClick : undefined}
                style={isInteractive ? { cursor: "pointer" } : undefined}
            >
                {image ?
                    <img src={image} className="cometchat-avatar__image" />
                    :
                    <span className="cometchat-avatar__text">
                        {name?.trim().substring(0, 1).toUpperCase()}
                    </span>
                }
            </div>
        </div>
    )
}

export { CometChatAvatar };