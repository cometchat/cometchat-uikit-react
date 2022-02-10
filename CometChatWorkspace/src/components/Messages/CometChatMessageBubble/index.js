import React from "react";

import { localize } from "../../";

import {
	CometChatMessageCategories,
	CometChatMessageTypes,
	CometChatCustomMessageTypes,
	CometChatMessageOptions,
	CometChatCustomMessageOptions,
	CometChatDeletedMessageBubble,
	CometChatTextBubble,
	CometChatFileBubble,
	CometChatImageBubble,
	CometChatAudioBubble,
	CometChatVideoBubble,
	CometChatPollBubble,
	CometChatStickerBubble,
	CometChatDocumentBubble,
	CometChatWhiteboardBubble,
	CometChatDefaultBubble,
} from "../";

import editIcon from "./resources/edit.svg";
import deleteIcon from "./resources/delete.svg";
import reactIcon from "./resources/reactions.svg";
import translateIcon from "./resources/message-translate.svg";
import sendMessageInPrivateIcon from "./resources/send-message-in-private.svg";

const CometChatMessageBubble = props => {

    const style = {
        cornerRadius: "12px",
        backgroundColor: "rgb(246, 246, 246)",
        titleColor: "rgb(20, 20, 20)",
        subTitleColor: "rgb(20, 20, 20, 60%)",
        iconColor: "rgb(20, 20, 20, 0.4)",
        usernameColor: "#39f",
        usernameFont: "600 13px Inter",
        voteCountColor: "rgb(20, 20, 20)",
        voteCountFont: "400 13px Inter,sans-serif",
        pollOptionsFont: "400 15px Inter,sans-serif",
        pollOptionsColor: "rgb(20, 20, 20)",
        pollOptionsBackgroundColor: "#fff",
        buttonTextColor: "#39f",
        buttonTextFont: "600 14px Inter,sans-serif",
        buttonBackgroundColor: "rgb(255, 255, 255)",
    };

    const hoverItemClickHandler = option => {
        props.onMessageOptionClick(option, props.messageObject);
    };

    const getCustomView = customView => {

        return (
            React.createElement(customView, {
                key: props.messageKey,
                messageObject: props.messageObject,
                messageAlignment: props.messageAlignment,
                messageTimeAlignment: props.messageTimeAlignment,
                cornerRadius: style.cornerRadius,
                loggedInUser: props.loggedInUser,
                width: "100%",
                height: "auto",
            })
        )
    }

    const getMessageOptions = messageTemplate => {
        
        if(!messageTemplate.options || !messageTemplate.options.length) {
            return [];
        }

        const messageOptions = [];
        messageTemplate.options.forEach(option => {

            switch(option) {

                case CometChatMessageOptions.edit: {

                    messageOptions.push({
                        id: option,
                        iconURL: editIcon,
                        iconTint: "#808080",
                        title: localize("EDIT_MESSAGE"),
                        width: "24px",
                        height: "24px",
                        onHoverItemClick: hoverItemClickHandler
                    });

                    break;
                }
                case CometChatMessageOptions.delete: {

                    messageOptions.push({
                        id: option,
                        iconURL: deleteIcon,
                        iconTint: "red",
                        title: localize("DELETE_MESSAGE"),
                        width: "24px",
                        height: "24px",
                        onHoverItemClick: hoverItemClickHandler
                    });
                    break;
                }
                case CometChatMessageOptions.reactToMessage: {
                    messageOptions.push({
                        id: option,
                        iconURL: reactIcon,
                        iconTint: "#808080",
                        title: localize("ADD_REACTION"),
                        width: "24px",
                        height: "24px",
                        onHoverItemClick: hoverItemClickHandler
                    });
                    break;
                }
                case CometChatMessageOptions.translate: {

                    messageOptions.push({
                        id: option,
                        iconURL: translateIcon,
                        iconTint: "#808080",
                        title: localize("TRANSLATE_MESSAGE"),
                        width: "24px",
                        height: "24px",
                        onHoverItemClick: hoverItemClickHandler
                    });
                    break;
                }
                case CometChatMessageOptions.replyInPrivate: {

                    messageOptions.push({
                        id: option,
                        iconURL: sendMessageInPrivateIcon,
                        iconTint: "#808080",
                        title: localize("SEND_MESSAGE_IN_PRIVATE"),
                        width: "24px",
                        height: "24px",
                        onHoverItemClick: hoverItemClickHandler
                    });
                    break;
                }
                default: 
                    break;
            }
        });

        return messageOptions;
    }

    const getMessage = () => {

        const templateFound = props.messageFilterList.find(messageTemplate => messageTemplate.type === props.messageObject.type);
        
        //if no message filters are set, return text message bubble
        if (!templateFound) {
            //return null;

            return (
                <CometChatTextBubble
                    key={props.messageKey}
                    messageObject={props.messageObject}
                    messageAlignment={props.messageAlignment}
                    messageTimeAlignment={props.messageTimeAlignment}
                    cornerRadius={props.messageStyle.cornerRadius}
                    backgroundColor={props.messageStyle.backgroundColor}
                    textColor={props.messageStyle.textColor}
                    loggedInUser={props.loggedInUser}
                    messageOptions={Object.keys(CometChatMessageOptions)}
                />
            )
        }

        const messageOptions = getMessageOptions(templateFound);
        switch (props.messageObject.type) {
            case CometChatMessageTypes.text: {

                if (templateFound.customView) {
                    return getCustomView(templateFound.customView);
                } else {
                    return (
                        <CometChatTextBubble
                            key={props.messageKey}
                            messageObject={props.messageObject}
                            messageAlignment={props.messageAlignment}
                            messageTimeAlignment={props.messageTimeAlignment}
                            cornerRadius={props.messageStyle.cornerRadius}
                            backgroundColor={props.messageStyle.backgroundColor}
                            textColor={props.messageStyle.textColor}
                            loggedInUser={props.loggedInUser}
                            messageOptions={messageOptions}
                        />
                    );
                }
            }
            case CometChatMessageTypes.image: {

                if(templateFound.customView) {
                    return getCustomView(templateFound.customView);
                } else {
                    return (
                        <CometChatImageBubble
                            key={props.messageKey}
                            messageObject={props.messageObject}
                            messageAlignment={props.messageAlignment}
                            messageTimeAlignment={props.messageTimeAlignment}
                            cornerRadius={props.messageStyle.cornerRadius}
                            loggedInUser={props.loggedInUser}
                            messageOptions={messageOptions}
                        />
                    )
                }
            }
            case CometChatMessageTypes.file: {

                if(templateFound.customView) {
                    return getCustomView(templateFound.customView);
                } else {
                    return (
                        <CometChatFileBubble
                            key={props.messageKey}
                            messageObject={props.messageObject}
                            messageAlignment={props.messageAlignment}
                            messageTimeAlignment={props.messageTimeAlignment}
                            cornerRadius={props.messageStyle.cornerRadius}
                            backgroundColor={props.messageStyle.backgroundColor}
                            titleFont={props.messageStyle.textFont}
                            titleColor={props.messageStyle.textColor}
                            subTitleColor={props.messageStyle.subTitleColor}
                            subTitleFont={props.messageStyle.subTitleFont}
                            iconTint={props.messageStyle.iconTint}
                            loggedInUser={props.loggedInUser}
                            messageOptions={messageOptions}
                        />
                    )
                }
            }
            case CometChatMessageTypes.audio: {

                if(templateFound.customView) {
                    return getCustomView(templateFound.customView);
                } else {
                    return (
                        <CometChatAudioBubble
                            key={props.messageKey}
                            messageObject={props.messageObject}
                            messageAlignment={props.messageAlignment}
                            messageTimeAlignment={props.messageTimeAlignment}
                            cornerRadius={props.messageStyle.cornerRadius}
                            backgroundColor={props.messageStyle.backgroundColor}
                            titleColor={props.messageStyle.titleColor}
                            subTitleColor={props.messageStyle.subTitleColor}
                            iconTint={props.messageStyle.iconTint}
                            loggedInUser={props.loggedInUser}
                            messageOptions={messageOptions}
                        />
                    )
                }
            }
            case CometChatMessageTypes.video: {

                if(templateFound.customView) {
                    return getCustomView(templateFound.customView);
                } else {
                    return (
                        <CometChatVideoBubble
                            key={props.messageKey}
                            messageObject={props.messageObject}
                            messageAlignment={props.messageAlignment}
                            messageTimeAlignment={props.messageTimeAlignment}
                            cornerRadius={props.messageStyle.cornerRadius}
                            backgroundColor={props.messageStyle.backgroundColor}
                            titleColor={props.messageStyle.textColor}
                            subTitleColor={props.messageStyle.textColor}
                            loggedInUser={props.loggedInUser}
                            messageOptions={messageOptions}
                        />
                    )
                }
            }
            default:
                break;
        }
    };

    const getCustomMessageOptions = messageTemplate => {

        if(!messageTemplate.options || !messageTemplate.options.length) {
            return [];
        }

        const messageOptions = [];
        messageTemplate.options.forEach(option => {

            switch(option) {

                case CometChatMessageOptions.replyInPrivate: {

                    messageOptions.push({
                        id: option,
                        iconURL: sendMessageInPrivateIcon,
                        iconTint: "#808080",
                        title: localize("SEND_MESSAGE_IN_PRIVATE"),
                        width: "24px",
                        height: "24px",
                        onHoverItemClick: hoverItemClickHandler
                    });
                    break;
                }
                case CometChatMessageOptions.delete: {

                    messageOptions.push({
                        id: option,
                        iconURL: deleteIcon,
                        iconTint: "red",
                        title: localize("DELETE_MESSAGE"),
                        width: "24px",
                        height: "24px",
                        onHoverItemClick: hoverItemClickHandler
                    });
                    break;
                }
                case CometChatMessageOptions.reactToMessage: {

                    messageOptions.push({
                        id: option,
                        iconURL: reactIcon,
                        iconTint: "#808080",
                        title: localize("ADD_REACTION"),
                        width: "24px",
                        height: "24px",
                        onHoverItemClick: hoverItemClickHandler
                    });
                    break;
                }
                default: 
                    break;
            }
            
        });

        return messageOptions;
    }

    const getCustomMessage = () => {

        const templateFound = props.messageFilterList.find(messageTemplate => messageTemplate.type === props.messageObject.type);

        if (!templateFound) {
            return null;
        }

        const messageOptions = getCustomMessageOptions(templateFound);
        switch (props.messageObject.type) {

            case CometChatCustomMessageTypes.poll: {

                if(templateFound.customView) {
                    return getCustomView(templateFound.customView);
                } else {
                    return (
                        <CometChatPollBubble
                            key={props.messageKey}
                            messageObject={props.messageObject}
                            messageAlignment={props.messageAlignment}
                            messageTimeAlignment={props.messageTimeAlignment}
                            cornerRadius={props.messageStyle.cornerRadius}
                            backgroundColor={props.messageStyle.backgroundColor}
                            usernameFont={style.usernameFont}
                            usernameColor={style.usernameColor}
                            pollQuestionColor={props.messageStyle.textColor}
                            pollQuestionFont={style.pollQuestionFont}
                            pollOptionsColor={style.pollOptionsColor}
                            pollOptionsFont={style.pollOptionsFont}
                            pollOptionsBackgroundColor={style.pollOptionsBackgroundColor}
                            voteCountColor={props.messageStyle.pollStyle.voteCountColor}
                            voteCountFont={props.messageStyle.pollStyle.voteCountFont}
                            loggedInUser={props.loggedInUser}
                            messageOptions={messageOptions}
                        />
                    );
                }
            }
            case CometChatCustomMessageTypes.sticker: {

                if(templateFound.customView) {
                    return getCustomView(templateFound.customView);
                } else {
                    return (
                        <CometChatStickerBubble
                            key={props.messageKey}
                            width="128px"
                            height="128px"
                            messageObject={props.messageObject}
                            messageAlignment={props.messageAlignment}
                            messageTimeAlignment={props.messageTimeAlignment}
                            usernameFont={style.usernameFont}
                            usernameColor={style.usernameColor}
                            loggedInUser={props.loggedInUser}
                            messageOptions={messageOptions}
                        />
                    )
                }
            }
            case CometChatCustomMessageTypes.whiteboard: {

                if(templateFound.customView) {
                    return getCustomView(templateFound.customView);
                } else {

                    return (
                        <CometChatWhiteboardBubble 
                            key={props.messageKey}
                            width="100%"
                            height="auto"
                            messageObject={props.messageObject} 
                            messageAlignment={props.messageAlignment}
                            messageTimeAlignment={props.messageTimeAlignment}
                            cornerRadius={props.messageStyle.cornerRadius}
                            backgroundColor={props.messageStyle.backgroundColor}
                            usernameFont={props.messageStyle.usernameFont}
                            usernameColor={props.messageStyle.usernameColor}
                            title={props.messageStyle.whiteboardStyle.title}
                            titleFont={props.messageStyle.whiteboardStyle.titleFont}
                            titleColor={props.messageStyle.whiteboardStyle.titleColor}
                            buttonText={props.messageStyle.whiteboardStyle.buttonText}
                            buttonTextFont={props.messageStyle.whiteboardStyle.buttonTextFont}
                            buttonTextColor={props.messageStyle.whiteboardStyle.buttonTextColor}
                            buttonBackgroundColor={props.messageStyle.whiteboardStyle.buttonBackgroundColor}
                            iconTint={props.messageStyle.whiteboardStyle.iconColor}
                            loggedInUser={props.loggedInUser}
                            messageOptions={messageOptions}
                        />
                    )
                }
            }
            case CometChatCustomMessageTypes.document: {

                if(templateFound.customView) {
                    return getCustomView(templateFound.customView);
                } else {

                    return (
                        <CometChatDocumentBubble
                            key={props.messageKey}
                            width="100%"
                            height="auto"
                            messageObject={props.messageObject}
                            messageAlignment={props.messageAlignment}
                            messageTimeAlignment={props.messageTimeAlignment}
                            cornerRadius={props.messageStyle.cornerRadius}
                            backgroundColor={props.messageStyle.backgroundColor}
                            usernameFont={props.messageStyle.usernameFont}
                            usernameColor={props.messageStyle.usernameColor}
                            title={props.messageStyle.documentStyle.title}
                            titleFont={props.messageStyle.documentStyle.titleFont}
                            titleColor={props.messageStyle.documentStyle.titleColor}
                            buttonText={props.messageStyle.documentStyle.buttonText}
                            buttonTextFont={props.messageStyle.documentStyle.buttonTextFont}
                            buttonTextColor={props.messageStyle.documentStyle.buttonTextColor}
                            buttonBackgroundColor={props.messageStyle.documentStyle.buttonBackgroundColor}
                            iconTint={props.messageStyle.documentStyle.iconColor}
                            loggedInUser={props.loggedInUser}
                            messageOptions={messageOptions}
                        />
                    )
                }
            }
            case CometChatCustomMessageTypes.location: {
                break;
                // if(templateFound.customView) {
                //     return getCustomView(templateFound.customView);
                // } else {

                //     return (
                //         <CometChatLocationBubble 
                //             key={props.messageKey}
                //             messageObject={props.messageObject}
                //             messageAlignment={props.messageAlignment}
                //             messageTimeAlignment={props.messageTimeAlignment}
                //             loggedInUser={props.loggedInUser}
                //             width="300px"
                //             height="250px"
                //             subTitle={localize("SHARED_LOCATION")}
                //             titleColor={style.titleColor}
                //             titleFont={style.titleFont}
                //             subTitleColor={style.subTitleColor}
                //             subTitleFont={style.voteCountFont}
                //             cornerRadius={style.cornerRadius} 
                //             backgroundColor={style.backgroundColor}
                //             usernameFont={style.usernameFont}
                //             usernameColor={style.usernameColor}
                //             messageOptions={messageOptions}
                //         />
                //     )
                // }
            }
            default: {

                if(templateFound && templateFound.customView) {
                    return getCustomView(templateFound.customView);
                } else {

                    return (
                        <CometChatDefaultBubble 
                            key={props.messageKey} 
                            messageTemplate={templateFound}
                            messageObject={props.messageObject} />
                    )
                }
            }
        }
    };
    
    //const renderItems = () => {

        if (props.messageObject.deletedAt) {
            return <CometChatDeletedMessageBubble key={props.messageKey} loggedInUser={props.loggedInUser} messageObject={props.messageObject} />;
        }

        let component = null;
        switch(props.messageObject.category) {
            case CometChatMessageCategories.message: {
                component = getMessage();
                break;
            }
            case CometChatMessageCategories.custom: {
                component = getCustomMessage();
                break;
            }
            default:
                break;
        }
    //}

    return component;
}

export { CometChatMessageBubble };