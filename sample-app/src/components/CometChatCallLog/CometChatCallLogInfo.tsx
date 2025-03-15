import { useCallback, useEffect, useState } from "react";
import outgoingCallSuccess from "../../assets/outgoingCallSuccess.svg";
import callRejectedIcon from "../../assets/callRejectedIcon.svg";
import incomingCallIcon from "../../assets/incomingCallIcon.svg";
import incomingCallSuccessIcon from "../../assets/incomingCallSuccess.svg";
import missedCallIcon from "../../assets/missedCallIcon.svg";
import "../../styles/CometChatCallLog/CometChatCallLogInfo.css";
import { CometChatDate, CometChatListItem, CometChatUIKit, CometChatUIKitConstants, DatePatterns, convertMinutesToHoursMinutesSeconds, localize } from "@cometchat/chat-uikit-react";

export const CometChatCallDetailsInfo = (props: { call: any }) => {
    const { call } = props;
    const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);

    useEffect(
        () => {
            CometChatUIKit.getLoggedinUser().then(
                (user) => {
                    setLoggedInUser(user);
                }
            );
        },
        [setLoggedInUser]
    );

    const getListItemSubtitleView = useCallback((item: any): JSX.Element => {
        return (
            <div className="cometchat-call-log-info__subtitle">
                <CometChatDate
                    pattern={DatePatterns.DateTime}
                    timestamp={item?.getInitiatedAt()}
                ></CometChatDate>
            </div>
        );
    }, [])

    const getCallDuration = useCallback((item: any) => {
        try {
            if (item?.getTotalDurationInMinutes()) {
                return convertMinutesToHoursMinutesSeconds(item?.getTotalDurationInMinutes());
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }, []);

    const getListItemTailView = useCallback((item: any): JSX.Element => {
        return (
            <div className={getCallDuration(item) ? "cometchat-call-log-info__trailing-view" : "cometchat-call-log-info__trailing-view-disabled"}>
                {getCallDuration(item) ? getCallDuration(item) : '00:00'}
            </div>
        );
    }, [getCallDuration]);

    const getCallStatus = (call: CometChat.Call, loggedInUser: CometChat.User): string => {
        const isSentByMe = (call: any, loggedInUser: CometChat.User) => {
            const senderUid: string = call.initiator?.getUid();
            return !senderUid || senderUid === loggedInUser?.getUid();
        }
        const callStatus: string = call.getStatus();
        const isSentByMeFlag: boolean = isSentByMe(call, loggedInUser!);
        switch (callStatus) {
            case CometChatUIKitConstants.calls.initiated: {
                if (isSentByMeFlag) {
                    return localize("OUTGOING_CALL");
                } else {
                    return localize('INCOMING_CALL');
                }
            }
            case CometChatUIKitConstants.calls.cancelled: {
                if (isSentByMeFlag) {
                    return localize("OUTGOING_CALL");
                } else {
                    return localize("MISSED_CALL");
                }
            }
            case CometChatUIKitConstants.calls.rejected: {
                if (isSentByMeFlag) {
                    return localize("OUTGOING_CALL");
                } else {
                    return localize("MISSED_CALL");
                }
            }
            case CometChatUIKitConstants.calls.busy: {
                if (isSentByMeFlag) {
                    return localize("OUTGOING_CALL");
                } else {
                    return localize("MISSED_CALL");
                }
            }
            case CometChatUIKitConstants.calls.ended: {
                if (isSentByMeFlag) {
                    return localize("OUTGOING_CALL");
                } else {
                    return localize('INCOMING_CALL');
                }
            }
            case CometChatUIKitConstants.calls.ongoing: {
                if (isSentByMeFlag) {
                    return localize("OUTGOING_CALL");
                } else {
                    return localize('INCOMING_CALL');
                }
            }
            case CometChatUIKitConstants.calls.unanswered: {
                if (isSentByMeFlag) {
                    return localize("OUTGOING_CALL");
                } else {
                    return localize("MISSED_CALL");
                }
            }
            default: {
                if (isSentByMeFlag) {
                    return localize("OUTGOING_CALL");
                } else {
                    return localize('INCOMING_CALL');
                }
            }
        }
    }

    function getAvatarUrlForCall(call: CometChat.Call) {
        const isSentByMe = (call: any, loggedInUser: CometChat.User) => {
            const senderUid: string = call.initiator?.getUid();
            return !senderUid || senderUid === loggedInUser?.getUid();
        }
        const isSentByMeFlag: boolean = isSentByMe(call, loggedInUser!);
        const callStatus = getCallStatus(call, loggedInUser!);
        switch (callStatus) {
            case localize("OUTGOING_CALL"): {
                if (isSentByMeFlag) {
                    return outgoingCallSuccess;
                } else {
                    return incomingCallSuccessIcon;
                }
            }
            case localize("INCOMING_CALL"):
                if (isSentByMeFlag) {
                    return outgoingCallSuccess;
                } else {
                    return incomingCallSuccessIcon;
                }
            case localize("CANCELLED_CALL"):
                if (isSentByMeFlag) {
                    return outgoingCallSuccess;
                } else {
                    return missedCallIcon;
                }
            case localize("REJECTED_CALL"):
                if (isSentByMeFlag) {
                    return outgoingCallSuccess;
                } else {
                    return missedCallIcon;
                }
            case localize("CALL_BUSY"):
                if (isSentByMeFlag) {
                    return outgoingCallSuccess;
                } else {
                    return missedCallIcon;
                }
            case localize("CALL_ENDED"):
                if (isSentByMeFlag) {
                    return outgoingCallSuccess;
                } else {
                    return incomingCallSuccessIcon;
                }
            case localize("CALL_ANSWERED"):
                if (isSentByMeFlag) {
                    return outgoingCallSuccess;
                } else {
                    return incomingCallSuccessIcon;
                }
            case localize("UNANSWERED_CALL"):
                if (isSentByMeFlag) {
                    return outgoingCallSuccess;
                } else {
                    return missedCallIcon;
                }
            case localize("MISSED_CALL"):
                if (isSentByMeFlag) {
                    return outgoingCallSuccess;
                } else {
                    return missedCallIcon;
                }
            default:
                return "";
        }
    }

    return (
        <div className="cometchat-call-log-info">
            <CometChatListItem
                title={getCallStatus(call, loggedInUser!)}
                avatarURL={getAvatarUrlForCall(call)}
                subtitleView={getListItemSubtitleView(call)}
                trailingView={getListItemTailView(call)}
            />
        </div>
    )
}