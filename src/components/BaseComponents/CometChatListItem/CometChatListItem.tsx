import { CSSProperties, MouseEvent, ReactNode, useRef, useState } from "react";
import { CometChatAvatar } from "../CometChatAvatar/CometChatAvatar";
import { useCometChatListItem } from "./useCometChatListItem";

interface ListItemProps {
    /* unique id to be given for the component. */
    id?: string;
    /* url of the image to be used for the avatar. */
    avatarURL?: string;
    /* name initials to be used for the avatar image if avatar url is not provided. */
    avatarName?: string;
    /* title text to be used for list view. */
    title: string;
    /* callback which is triggered on click of the list item. */
    onListItemClicked?: (input: { id?: string }) => void;
    /* html component which is used for showing menu. */
    menuView?: ReactNode;
    /* html component which is used for showing subtitle view. */
    subtitleView?: ReactNode;
    /* html component which is used for showing tail view. */
    trailingView?: ReactNode;
    /* html component which is used for showing title view. */
    titleView?: ReactNode;
    /* html component which is used for showing leading  view. */
    leadingView?: ReactNode;
    /* boolean flag to stop event propogation */
    stopEventPropagation?: boolean;
    /* custom style overrides applied to the list item container */
    style?: CSSProperties;
}

/* 
    CometChatListItem is a composite component used to display a list of user views. 
    It accepts inputs related to the avatar and title, as well as a callback function that is triggered when the list item is clicked. 
    It also accepts input parameters such as statusIndicatorColor, statusIndicatorIcon and hideSeparator for customization purposes.
*/
const CometChatListItem = (props: ListItemProps) => {
    const {
        id = "",
        avatarURL = "",
        avatarName = "",
        title = "",
        onListItemClicked = () => { },
        menuView,
        subtitleView,
        trailingView,
        titleView,
        leadingView,
        stopEventPropagation = false,
        style
    } = props;


    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const {
        listItemClick,
        isHovering,
        hideTail,
        showTail,
    } = useCometChatListItem({ onListItemClicked, id,menuRef });

    return (
        <div className="cometchat" style={{
            width: "100%",
            height: "fit-content"
        }}>
            <div
                onMouseEnter={() => {
                    showTail()
                    setIsMenuVisible(true)
                }}
                onMouseLeave={() => {
                    hideTail()
                    setIsMenuVisible(false)
                }}
                className="cometchat-list-item"
                style={style}
                id={id}
                onClick={listItemClick}
            >
                {!leadingView ?
                    avatarName?.trim()?.length > 0 ||
                        avatarURL?.trim()?.length > 0
                        ? <div className="cometchat-list-item__leading-view">
                            <CometChatAvatar
                                image={avatarURL}
                                name={avatarName}
                            />
                            <div className="cometchat-status-indicator cometchat-list-item__status">
                                <div className="cometchat-list-item__status-icon"></div>
                            </div>

                        </div>
                        : null
                    : leadingView}
                <div className="cometchat-list-item__body">
                    <div className="cometchat-list-item__title-container">
                        {titleView ?? <div className="cometchat-list-item__body-title">
                            {title}
                        </div>}
                        <div className="cometchat-list-item__body-subtitle">
                            {subtitleView}
                        </div>
                    </div >
                    <div
                        onClick={(event: MouseEvent<HTMLDivElement>) => {
                            if (event?.stopPropagation && stopEventPropagation) {
                                event.stopPropagation();
                            }
                        }}
                        className={!isHovering || (isHovering && !menuView) ? "cometchat-list-item__trailing-view" : "cometchat-list-item__trailing-view-hidden"}
                    >
                        {trailingView}
                    </div>
                    <div
                       ref={menuRef}
                        className={isHovering && menuView ? "cometchat-list-item__menu-view" : "cometchat-list-item__trailing-view-hidden"}
                        onClick={(event: MouseEvent<HTMLDivElement>) => {
                            if (event?.stopPropagation) {
                                event.stopPropagation();
                            }
                        }}
                    >
                        {isMenuVisible && menuView ? menuView : null}
                    </div>
                </div >
            </div >
        </div>
    )
}

export { CometChatListItem };
