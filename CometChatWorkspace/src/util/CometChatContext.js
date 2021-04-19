import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatToastNotification } from "../components/Shared";

import Translator from "../resources/localization/translator";
import * as enums from "./enums.js";

export const CometChatContext = React.createContext({});

export class CometChatContextProvider extends React.Component {

    constructor(props) {

        super(props);

        this.state = {
            item: {},
            type: "",
            toastMessage: props.toastMessage,
            groupMembers: props.groupMembers,
            bannedGroupMembers: props.bannedGroupMembers,
            groupAdmins: props.groupAdmins,
            groupModerators: props.groupModerators,
            callInProgress: props.callInProgress,
            callType: "",
            deletedGroupId: "",
            leftGroupId: "",
            lastMessage: {},
            unreadMessages: [],
            clearedUnreadMessages: false,
            directCallCustomMessage: {},
            directCallCustomMessageAction: "",
            setGroupMembers: this.setGroupMembers,
            updateGroupMembers: this.updateGroupMembers,
            setAllGroupMembers: this.setAllGroupMembers,
            setGroupAdmins: this.setGroupAdmins,
            setGroupModerators: this.setGroupModerators,
            setBannedGroupMembers: this.setBannedGroupMembers,
            updateBannedGroupMembers: this.updateBannedGroupMembers,
            clearGroupMembers: this.clearGroupMembers,
            setToastMessage: this.setToastMessage,
            setCallInProgress: this.setCallInProgress,
            setItem: this.setItem,
            setType: this.setType,
            setTypeAndItem: this.setTypeAndItem,
            setDeletedGroupId: this.setDeletedGroupId,
            setLeftGroupId: this.setLeftGroupId,
            setLastMessage: this.setLastMessage,
            setUnreadMessages: this.setUnreadMessages,
            clearUnreadMessages: this.clearUnreadMessages,
            setClearedUnreadMessages: this.setClearedUnreadMessages,
            setDirectCallCustomMessage: this.setDirectCallCustomMessage
        }

        this.toastRef = React.createRef();
    }

    componentDidMount() {

        if (this.props.user.trim().length) {

            this.getUser(this.props.user.trim()).then(user => {

                this.setType(CometChat.ACTION_TYPE.TYPE_USER);
                this.setItem(user);

            }).catch(error => {

                const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "UID_NOT_AVAILABLE"
                this.toastRef.setError(errorCode);
            });
            
            
        } else if (this.props.group.trim().length) {

            this.getGroup(this.props.group.trim()).then(group => {

                this.setType(CometChat.ACTION_TYPE.TYPE_GROUP);
                this.setItem(group);

            }).catch(error => {

                const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "GUID_NOT_AVAILABLE"
                this.toastRef.setError(errorCode);
            });

        } else if (this.props.user.trim().length === 0 && this.props.group.trim().length === 0 && this.props._component === enums.CONSTANTS["MESSAGES_COMPONENT"]) {

            const errorCode = "UID_OR_GUID_NOT_AVAILABLE"
            this.toastRef.setError(errorCode);
        }
    }

    componentDidUpdate(prevProps) {

        if (this.props.user.trim().length && prevProps.user !== this.props.user) {
            
            this.getUser(this.props.user).then(user => {

                this.setType(CometChat.ACTION_TYPE.TYPE_USER);
                this.setItem(user);
                this.clearUnreadMessages();
                this.setClearedUnreadMessages(false);

            }).catch(error => {

                const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "UID_NOT_AVAILABLE"
                this.toastRef.setError(errorCode);
            });

        } else if (this.props.group.trim().length && prevProps.group !== this.props.group) {
            
            this.getGroup(this.props.group).then(group => {

                this.setType(CometChat.ACTION_TYPE.TYPE_GROUP);
                this.setItem(group);
                this.clearUnreadMessages();
                this.setClearedUnreadMessages(false);

            }).catch(error => {

                const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "UID_NOT_AVAILABLE"
                this.toastRef.setError(errorCode);
            });
        }
        
        //when the active group is deleted, close the chat window.
        if (this.state.type === CometChat.ACTION_TYPE.TYPE_GROUP && this.state.item.guid === this.state.deletedGroupId) {

            this.setItem({});
            this.setType("");
            this.setDeletedGroupId("");
        }

        //when the active group is left, close the chat window.
        if (this.state.type === CometChat.ACTION_TYPE.TYPE_GROUP && this.state.item.guid === this.state.leftGroupId) {

            this.setTypeAndItem({} , "");
            this.setLeftGroupId("");
        }
    }

    getUser = (uid) => {

        const promise = new Promise((resolve, reject) => {

            if (!uid) {
                const error = { "code": "UID_NOT_AVAILABLE" };
                reject(error);
            }

            CometChat.getUser(uid).then(user => resolve(user)).catch(error => reject(error));
        });

        return promise;
    }

    getGroup = (guid) => {

        const promise = new Promise((resolve, reject) => {

            if (!guid) {
                const error = { "code": "GUID_NOT_AVAILABLE" };
                reject(error);
            }

            CometChat.getGroup(guid).then(group => {

                if (group.hasJoined === false) {

                    const guid = group.guid;
                    const groupType = group.type;
                    let password = "";
                    if (groupType === CometChat.GROUP_TYPE.PASSWORD) {

                        const promptMessage = Translator.translate("ENTER_PASSWORD_JOIN_GROUP", this.props.lang);
                        password = prompt(promptMessage);
                    }

                    CometChat.joinGroup(guid, groupType, password).then(group => {

                        this.setToastMessage("success", "GROUP_JOIN_SUCCESS");
                        resolve(group);

                    }).catch(error => reject(error));

                } else {
                    resolve(group);
                }

            }).catch(error => reject(error));
        });

        return promise;
    }

    setToastMessage = (type, message) => {

        // switch(type) {

        //     case "error": 
        //         this.toastRef.setError(message);
        //     break;
        //     case "success":
        //         this.toastRef.setSuccess(message);
        //         break;
        //     case "info":
        //         this.toastRef.setInfo(message);
        //         break;
        //     case "warning":
        //         this.toastRef.setWarning(message);
        //         break;
        //     default:
        //     break;
        // }

        return null;
    }

    clearGroupMembers = () => {

        this.setState({
            groupMembers: [],
            groupAdmins: [],
            groupModerators: [],
            bannedGroupMembers: []
        });
    }

    setAllGroupMembers = (groupMembers, groupAdmins, groupModerators) => {

        this.setState({
            groupMembers: [...this.state.groupMembers, ...groupMembers],
            groupAdmins: [...this.state.groupAdmins, ...groupAdmins],
            groupModerators: [...this.state.groupModerators, ...groupModerators]
        });

    }

    updateGroupMembers = (groupMembers) => {

        this.setState({
            groupMembers: [...groupMembers]
        });
    }

    setGroupMembers = (groupMembers) => {

        this.setState({
            groupMembers: [...this.state.groupMembers, ...groupMembers]
        });
    }

    setGroupAdmins = (groupAdmins) => {

        this.setState({
            groupAdmins: [...this.state.groupAdmins, ...groupAdmins]
        });
    }

    setGroupModerators = (groupModerators) => {

        this.setState({
            groupModerators: [...this.state.groupModerators, ...groupModerators]
        });
    }

    setBannedGroupMembers = (bannedMembers) => {

        this.setState({
            bannedGroupMembers: [...this.state.bannedGroupMembers, ...bannedMembers]
        });
    }

    updateBannedGroupMembers = (bannedMembers) => {
        
        this.setState({
            bannedGroupMembers: [...bannedMembers]
        });
    }

    setCallInProgress = (call, callType) => {

        this.setState({ callInProgress: { ...call }, callType })
    }

    setItem = (item) => {
        this.setState({ item: { ...item } });
    }

    setType = (type) => {
        this.setState({ type });
    }

    setTypeAndItem = (type, item) => {
        this.setState({ item: { ...item }, type });
    }

    setDeletedGroupId = (guid) => {
        this.setState({ deletedGroupId: guid });
    }

    setLeftGroupId = (guid) => {
        this.setState({ leftGroupId: guid });
    }

    setLastMessage = (message) => {
        this.setState({ lastMessage: message });
    }

    setUnreadMessages = (newMessage) => {

        let messageList = [...this.state.unreadMessages];
        messageList = messageList.concat(newMessage);

        this.setState({ unreadMessages: messageList });
        this.setClearedUnreadMessages(false);
    }

    clearUnreadMessages = () => {
        this.setState({ unreadMessages: [] });
    }

    setClearedUnreadMessages = (flag) => {
        this.setState({ clearedUnreadMessages: flag });
    }

    setDirectCallCustomMessage = (message, event) => {
        this.setState({ directCallCustomMessage: message, directCallCustomMessageAction: event });
    }

    render() {

        return (
            <CometChatContext.Provider value={this.state}>
                <CometChatToastNotification ref={el => this.toastRef = el} lang={this.props.lang} position={this.props.toastNotificationPos} />
                {this.props.children}
            </CometChatContext.Provider>
        );
    }
}

CometChatContextProvider.defaultProps = {
    toastMessage: {},
    groupMembers: [],
    bannedGroupMembers: [],
    groupAdmins: [],
    groupModerators: [],
    callInProgress: {},
    user: "",
    group: "",
    _component: "",
    lang: Translator.getDefaultLanguage(),
};

CometChatContextProvider.propTypes = {
    toastMessage: PropTypes.object,
    groupMembers: PropTypes.array,
    bannedGroupMembers: PropTypes.array,
    groupAdmins: PropTypes.array,
    groupModerators: PropTypes.array,
    callInProgress: PropTypes.object,
    group: PropTypes.string,
    user: PropTypes.string,
    _component: PropTypes.string,
    lang: PropTypes.string,
}
