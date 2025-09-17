import { ReactNode, useCallback, useEffect, useState } from "react";
import "../../styles/CometChatCallLog/CometChatCallLogDetails.css";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatCallDetailsInfo } from "./CometChatCallLogInfo";
import { CometChatCallDetailsParticipants } from "./CometChatCallLogParticipants";
import { CometChatCallDetailsRecording } from "./CometChatCallLogRecordings";
import { CometChatCallDetailsHistory } from "./CometChatCallLogHistory";
import { ChatConfigurator, CometChatListItem, CometChatMessageHeader, CometChatUIKitConstants, CometChatUIKitLoginListener, localize, MessageUtils } from "@cometchat/chat-uikit-react";

export const CometChatCallDetails = (props: { selectedItem: any, onBack?: () => void }) => {
    const { selectedItem, onBack } = props;
    const callDetailTabItems = [{
        id: "participants",
        name: localize("PARTICIPANTS")
    },
    {
        id: "recording",
        name: localize("RECORDING")
    },
    {   
        id: "history",
        name: localize("HISTORY")
    }];
    const [activeTab, setActiveTab] = useState("participants");
    const [user, setUser] = useState<CometChat.User>();
    const [subtitleText, setSubtitleText] = useState<string>();

    function verifyCallUser(call: any, loggedInUser: CometChat.User) {
        if (call.getInitiator().getUid() === loggedInUser.getUid()) {
            return call.getReceiver();
        } else {
            return call.getInitiator();
        }
    }
    useEffect(()=>{
        let isBlocked = new MessageUtils().getUserStatusVisible(user);
        const userListenerId = "users_custom" + Date.now();
        if(isBlocked){
            setSubtitleText("")
            return;
        }
        setSubtitleText(localize(`CALL_LOGS_USER_STATUS_${user?.getStatus().toUpperCase()}`));
        CometChat.addUserListener(
            userListenerId,
            new CometChat.UserListener({
                onUserOnline: (onlineUser: CometChat.User) => {
                    if (user?.getUid() === onlineUser.getUid()) {
                        setSubtitleText(localize("CALL_LOGS_USER_STATUS_ONLINE"));
                    }
                },
                onUserOffline: (offlineUser: CometChat.User) => {
                    if (user?.getUid() === offlineUser?.getUid()) {
                        setSubtitleText(localize("CALL_LOGS_USER_STATUS_OFFLINE"));
                    }
                },
            })
        );
        return () => {
            CometChat.removeUserListener(userListenerId);
        };
    },[user])

    useEffect(() => {
        const loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();
        const callUser = verifyCallUser(selectedItem, loggedInUser!);
        if (selectedItem.receiverType === CometChatUIKitConstants.MessageReceiverType.user) {
            CometChat.getUser(callUser.uid).then((response: CometChat.User) => {
                setUser(response);
            });
        }
    
    }, [selectedItem]);
    const  getSubtitleView = useCallback(() => {
        return <div className={`cometchat-call-log-details__subtitle`}>
        {subtitleText}
    </div>
    },[subtitleText,user])
    function getTrailingView(){
        return <div className={`cometchat-call-log-details__trailing-view`}>
        {ChatConfigurator.getDataSource().getAuxiliaryHeaderMenu(user) as  ReactNode}
    </div>
    }

    const getLoadingView = () => {
        return (
            <div className='cometchat-call-log-details__header__shimmer__shimmer'>
              {[...Array(1)].map((_, index) => (
                <div key={index} className='cometchat-call-log-details__header__shimmer-item'>
                  <div className='cometchat-call-log-details__header__shimmer-item-avatar'></div>
                  <div className='cometchat-call-log-details__header__shimmer-item-body'>
                    <div className='cometchat-call-log-details__header__shimmer-item-body-title-wrapper'>
                      <div className='cometchat-call-log-details__header__shimmer-item-body-title'></div>
                      <div className='cometchat-call-log-details__shimmer-item-body-subtitle'></div>
                    </div>

                    <div className='cometchat-call-log-details__header__shimmer-item-body-tail'></div>
                    <div className='cometchat-call-log-details__header__shimmer-item-body-tail'></div>
                  </div>
                </div>
              ))}
            </div>
          );
      };

    return (
        <div className="cometchat-call-log-details">
            <div className="cometchat-call-log-details__header">
                <div className="cometchat-call-log-details__header-back" onClick={onBack} />
                {localize("CALL_DETAILS")}
            </div>
            <div className="cometchat-call-log-details__call-log-item">
            {user? <CometChatListItem avatarName={user?.getName()} avatarURL={user?.getAvatar()} title={user?.getName() || ""} subtitleView={getSubtitleView()}  trailingView={getTrailingView()}/> : getLoadingView()}
            </div>
            <CometChatCallDetailsInfo call={selectedItem} />
            <div className="cometchat-call-log-details__tabs">
                {callDetailTabItems.map((tabItem) => (
                    <div
                        onClick={() => setActiveTab(tabItem.id)}
                        className={activeTab === tabItem.id ? "cometchat-call-log-details__tabs-tab-item-active" : "cometchat-call-log-details__tabs-tab-item"}
                    >
                        {tabItem.name}
                    </div>
                ))}
            </div>

            <>
                {activeTab === "participants" ? <CometChatCallDetailsParticipants call={selectedItem} />
                    : activeTab === "recording" ? <CometChatCallDetailsRecording call={selectedItem} />
                        : activeTab === "history" ? <CometChatCallDetailsHistory call={selectedItem} />
                            : null
                }
            </>
        </div>
    )
}