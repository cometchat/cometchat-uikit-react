
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
    const isClickable = typeof onClick === "function";
    const shouldShowPointer = isClickable && !disablePointer;

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
                onClick={onClick}
                onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                aria-label={isClickable ? `View ${name || 'user'} profile` : undefined}
                style={shouldShowPointer ? { cursor: "pointer" } : undefined}
            >
                {image ?
                    <img src={image} className="cometchat-avatar__image" alt={`${name || 'User'} avatar`} />
                    :
                    <span className="cometchat-avatar__text" aria-label={`${name || 'User'} avatar`}>
                        {name?.trim().substring(0, 1).toUpperCase()}
                    </span>
                }
            </div>
        </div>
    )
}

export { CometChatAvatar };