import { CometChatAvatar, localize } from "@cometchat/chat-uikit-react";
import "../../styles/CometChatDetails/CometChatUserDetails.css";
import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
interface UserDetailProps {
    user: CometChat.User;
    onHide?: () => void;
    actionItems?: {
        name: string;
        icon: string;
        id?:string;
    }[];
    showStatus?: boolean;
    onUserActionClick?: (item: {
        name: string;
        icon: string;
    }) => void;
}

export const CometChatUserDetails = (props: UserDetailProps) => {
    const {
        user,
        onHide = () => { },
        actionItems = [],
        showStatus,
        onUserActionClick = () => { }
    } = props;
    const { appState } = useContext(AppContext);
    return (
        <>
            <div className="cometchat-user-details__header">
                <div className="cometchat-user-details__header-text">{localize("USER_INFO")}</div>
                <div className="cometchat-user-details__header-icon" onClick={onHide} />
            </div>
            <div className="cometchat-user-details__content">
                <div className="cometchat-user-details__content-avatar">
                    <CometChatAvatar
                        image={user.getAvatar?.()}
                        name={user.getName()}
                    />
                </div>
                <div>
                    <div className="cometchat-user-details__content-title">
                        {user.getName()}
                    </div>
                    {showStatus && <div className="cometchat-user-details__content-description">
                        {localize(user.getStatus?.().toUpperCase())}
                    </div>}
                </div>

                <div className="cometchat-user-details__content-action">
                    {actionItems.map((actionItem) => (
                        <div key={actionItem.name}
                            className={`${appState.isFreshChat && actionItem.id === 'delete_chat' ? 'cometchat-user-details__content-action-item-disabled' : ''} cometchat-user-details__content-action-item`}
                            onClick={() =>
                                onUserActionClick(actionItem)
                            }
                        >
                            <div
                                className="cometchat-user-details__content-action-item-icon"
                                style={actionItem.icon ? { WebkitMask: `url(${actionItem.icon}) center center no-repeat` } : undefined}
                            />
                            <div className="cometchat-user-details__content-action-item-text">
                                {actionItem.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}