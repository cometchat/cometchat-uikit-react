
interface BaseProps {
    /** Name used for displaying initials in the avatar. */
    name?: string;
    /** URL of the avatar image to be displayed. */
    image?: string;
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
    } = props;

    const splitName = name.split(" ");

    return (
        <div className="cometchat" style={{
            height: "inherit",
            width: "inherit",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
        }}>
            <div className="cometchat-avatar">
                {image ?
                    <img src={image} className="cometchat-avatar__image" />
                    :
                    <span className="cometchat-avatar__text">
                        {(splitName.length && splitName.length > 1) ? splitName[0].substring(0, 1).toUpperCase() + splitName[1].substring(0, 1).toUpperCase() : name.substring(0, 2).toUpperCase()}
                    </span>
                }
            </div>
        </div>
    )
}

export { CometChatAvatar };