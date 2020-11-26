import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';
import { Emoji } from "emoji-mart";
import { CometChat } from "@cometchat-pro/chat";

import { checkMessageForExtensionsData, validateWidgetSettings } from "../../util/common";

import {
    messageReactionsStyle,
    reactionCountStyle,
    emojiButtonStyle,
} from "./style";

import reactIcon from "./resources/add-reaction.png";

class RegularReactionView extends React.Component {

    constructor(props) {

        super(props);
        this.state = {
            message: props.message,
            reaction: props.reaction
        }
    }

    componentDidUpdate(prevProps, prevState) {

        if (prevProps.message !== this.props.message) {
            this.setState({ message: this.props.message });
        }
    }

    reactToMessages = (emoji) => {

        CometChat.callExtension("reactions", "POST", "v1/react", {
            msgId: this.state.message.id,
            emoji: emoji.colons,
        }).then(response => {
            // Reaction added successfully
        }).catch(error => {
            // Some error occured
        });
    }

    triggerEmojiClick = (event) => {

        event.stopPropagation();
        event.currentTarget.querySelector(".emoji-mart-emoji").click();
    }

    getMessageReactions = (reaction) => {

        if(reaction === null) {
            return null;
        }

        const messageReactions = Object.keys(reaction).map((data, key) => {

            const reactionData = reaction[data];
            const reactionName = data.replaceAll(":", "");
            const reactionCount = Object.keys(reactionData).length;

            if (!reactionCount) {
                return null;
            }

            const userList = [];
            let reactionTitle = "";

            for (const user in reactionData) {
                userList.push(reactionData[user]["name"]);
            }

            if (userList.length) {
                reactionTitle = userList.join(", ");
                reactionTitle = reactionTitle.concat(" reacted");
            }

            const reactionClassName = `reaction reaction__${reactionName}`;
            return (
                <div
                key={key}
                css={messageReactionsStyle(this.props, reactionData)}
                className={reactionClassName}
                title={reactionTitle}
                onClick={this.triggerEmojiClick}>
                    <Emoji
                    emoji={{ id: reactionName }}
                    size={16}
                    native
                    onClick={this.reactToMessages} />
                    <span css={reactionCountStyle(this.props)} className="reaction__count">{reactionCount}</span>
                </div>
            );
        });

        return messageReactions;
    }

    addMessageReaction = () => {

        //if message reactions are disabled in chat widget
        if (validateWidgetSettings(this.props.widgetsettings, "allow_message_reactions") === false) {
            return null;
        }

        const addReactionEmoji = (
            <div 
            key="-1" 
            css={messageReactionsStyle(this.props, {})} 
            className="reaction reaction__add"
            title="Add reaction...">
                <button
                type="button"
                css={emojiButtonStyle(reactIcon)}
                className="button__reacttomessage"
                onClick={() => this.props.actionGenerated("reactToMessage", this.props.message)}><span></span></button>
            </div>
        );

        return addReactionEmoji;
    }

    render() {

        const reaction = checkMessageForExtensionsData(this.state.message, "reactions");
        const messageReactions = this.getMessageReactions(reaction);
        // const messageReactions = Object.keys(reaction).map((data, key) => {

        //     const reactionData = reaction[data];
        //     const reactionName = data.replaceAll(":", "");
        //     const reactionCount = Object.keys(reactionData).length;
            
        //     if(!reactionCount) {
        //         return null;
        //     }

        //     const userList = [];
        //     let reactionTitle = "";

        //     for (const user in reactionData) {
        //         userList.push(reactionData[user]["name"]);
        //     }

        //     if (userList.length) {

        //         userList.push(" reacted");
        //         reactionTitle = userList.join(", ");
        //     }

        //     const reactionClassName = `reaction reaction__${reactionName}`;
        //     return (
        //         <div 
        //         key={key} 
        //         css={messageReactionsStyle(this.props, reactionData)} 
        //         className={reactionClassName}
        //         title={reactionTitle}>
        //             <Emoji 
        //             emoji={{ id: reactionName }} 
        //             size={16} 
        //             native
        //             onClick={this.reactToMessages} />
        //             <span css={reactionCountStyle(this.props)} className="reaction__count">{reactionCount}</span>
        //         </div>
        //     );
        // });

        const addReactionEmoji = this.addMessageReaction();

        // const addReactionEmoji = (
        //     <div key="-1" css={messageReactionsStyle(this.props, {})}>
        //         <button
        //         type="button"
        //         css={emojiButtonStyle(reactIcon)}
        //         className="button__reacttomessage"
        //         onClick={() => this.props.actionGenerated("reactToMessage", this.props.message)}></button>
        //     </div>
        // );

        if (messageReactions !== null && messageReactions.length && addReactionEmoji !== null) {

            if (this.props.message.messageFrom === "receiver") {
                messageReactions.push(addReactionEmoji);
            } else {
                messageReactions.unshift(addReactionEmoji);
            }
        }

        return (messageReactions);
    }
}

export default RegularReactionView;