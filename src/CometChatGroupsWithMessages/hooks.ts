import { CometChat } from "@cometchat-pro/chat";
import { useEffect } from "react";
import { MessagesConfiguration } from "uikit-utils-lerna";

function Hooks(
    loggedInUser: any,
	setLoggedInUser: Function,
	subscribeToEvents: Function,
    onErrorCallback: Function,
    isMobileView: any,
    messagesConfigRef: any,
    joinGroupConfigRef: any,
    group: any,
    setActiveGroup: any,
    messagesConfiguration: MessagesConfiguration | undefined,
    onBack: Function,
    createGroupElement: any,
    createGroupButtonRef: any,
    openCreateGroup: Function,
    closeCreateGroup: Function,
    joinGroupElement: any,
    onGroupJoined: Function,
    createGroupConfigCreateClick : ((group: CometChat.Group) => void) | null | undefined,
    joinGroupConfigOnError : ((error: any) => void) | null | undefined,
    joinGroupConfigJoinClick : ((group: CometChat.Group, password: string) => void) | null | undefined
) {
    useEffect(
        () => {
            CometChat.getLoggedinUser().then(
                (user) => {
                    setLoggedInUser(user);
                },
                (error: CometChat.CometChatException) => {
                    onErrorCallback(error);
                }
            );
        },
        [setLoggedInUser, onErrorCallback]
    );

    useEffect(()=>{
        if(loggedInUser){
            return subscribeToEvents();
        }
    }, [loggedInUser, subscribeToEvents]);

    useEffect(
        ()=>{
            const element = createGroupButtonRef.current;
            if (!element) return;
            const openCreateGroupModal = () => {
                openCreateGroup();
            }
            element.addEventListener("cc-button-clicked", openCreateGroupModal);
            return ()=>{
                element.removeEventListener("cc-button-clicked", openCreateGroupModal);
            }
        }, [openCreateGroup, createGroupButtonRef]
    )

    useEffect(
        () => {
            if (isMobileView) {
                if(messagesConfigRef?.current && messagesConfigRef?.current?.messageHeaderConfiguration){
                    messagesConfigRef.current.messageHeaderConfiguration.hideBackButton = false;
                }

                if(joinGroupConfigRef?.current && joinGroupConfigRef?.current?.messageHeaderConfiguration){
                    joinGroupConfigRef.current.messageHeaderConfiguration.hideBackButton = false;
                }
            } else {
                if(messagesConfigRef?.current && messagesConfigRef?.current?.messageHeaderConfiguration){
                    messagesConfigRef.current.messageHeaderConfiguration.hideBackButton = true;
                }
                if(joinGroupConfigRef?.current && joinGroupConfigRef?.current?.messageHeaderConfiguration){
                    joinGroupConfigRef.current.messageHeaderConfiguration.hideBackButton = true;
                }
            }
        }, [isMobileView, joinGroupConfigRef, messagesConfigRef]
    );

    useEffect(
        () => {
            setActiveGroup(group);
        }, [group, setActiveGroup]
    );

    useEffect(
        () => {
            if (!messagesConfiguration?.messageHeaderConfiguration?.onBack) {
                if(messagesConfigRef?.current && messagesConfigRef?.current?.messageHeaderConfiguration){
                    messagesConfigRef.current.messageHeaderConfiguration.onBack = onBack;
                }
            }
        }, [messagesConfiguration, messagesConfigRef, onBack]
    );

    useEffect(
        () => {
            if (!joinGroupElement) return;
            const eventName = "cc-joingroup-joined";
            const onJoinGroupButtonClicked = (event: any) => onGroupJoined(event);
            joinGroupElement.addEventListener(eventName, onJoinGroupButtonClicked);
            return () => {
                joinGroupElement.removeEventListener(eventName, onJoinGroupButtonClicked);
            };
        }, [joinGroupElement, onGroupJoined]
    )

    useEffect(()=>{
        if (!createGroupElement) return;
        const eventName = "cc-creategroup-close-clicked";
        const closeCreateGroupModal = () => closeCreateGroup();
        createGroupElement.addEventListener(eventName, closeCreateGroupModal);
        return () => {
            createGroupElement.removeEventListener(eventName, closeCreateGroupModal);
        };
    }, [createGroupElement, closeCreateGroup]);

    useEffect(()=>{
        if (!createGroupElement) return;
        if (createGroupConfigCreateClick) {
            createGroupElement.createClick = createGroupConfigCreateClick;
            return () => {
                createGroupElement.createClick = null;
            };
        }
    }, [createGroupConfigCreateClick, createGroupElement]);

    useEffect(() => {
        if (!joinGroupElement) return;
        if (joinGroupConfigJoinClick) {
            joinGroupElement.joinClick = joinGroupConfigJoinClick;
            return () => {
                joinGroupElement.joinClick = null;
            };
        }
    }, [joinGroupConfigJoinClick, joinGroupElement]);

    useEffect(() => {
        if (!joinGroupElement) return;
        if (joinGroupConfigOnError) {
            joinGroupElement.onError = joinGroupConfigOnError;
            return () => {
                joinGroupElement.onError = null;
            };
        }
    }, [joinGroupConfigOnError, joinGroupElement]);
}

export { Hooks };