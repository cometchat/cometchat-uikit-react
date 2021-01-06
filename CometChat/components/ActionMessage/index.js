import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'
import PropTypes from 'prop-types';

import { CometChat } from "@cometchat-pro/chat";

import { theme } from "../../resources/theme";
import Translator from "../../resources/localization/translator";

import { actionMessageStyle, actionMessageTxtStyle } from "./style"

class ActionMessage extends React.Component {

    loggedInUser = null;

    constructor(props) {

        super(props);

        this.loggedInUser = props.loggedInUser;
    }

    getMessage = (message) => {

        let actionMessage = null;

        if (message.hasOwnProperty("actionBy") === false || message.hasOwnProperty("actionOn") === false) {
            return actionMessage;
        }

        if (message.action !== CometChat.ACTION_TYPE.MEMBER_JOINED 
        && message.action !== CometChat.ACTION_TYPE.MEMBER_LEFT
        && (message.actionBy.hasOwnProperty("name") === false || message.actionOn.hasOwnProperty("name") === false)) {
            return actionMessage;
        }

        if (message.action === CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED) {

            if (message.hasOwnProperty("extras")) {

                if (message.extras.hasOwnProperty("scope")) {

                    if (message.extras.scope.hasOwnProperty("new") === false) { return actionMessage; }

                } else { return actionMessage; }
                
            } else { return actionMessage; }
        }

        if (message.action === CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED && message.extras.hasOwnProperty("scope") === false) {
            return actionMessage;
        }

        if (message.action === CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED && message.extras.scope.hasOwnProperty("new") === false) {
            return actionMessage;
        }

        const byEntity = message.actionBy;
        const onEntity = message.actionOn;

        //const byString = (byEntity.uid === this.loggedInUser.uid) ? `${Translator.translate("YOU", this.props.lang)}` : byEntity.name;
        const byString = byEntity.name;
        const forString = (message.action !== CometChat.ACTION_TYPE.MEMBER_JOINED && message.action !== CometChat.ACTION_TYPE.MEMBER_LEFT) ? onEntity.name : "";

        switch (message.action) {

            case "added":
                actionMessage = `${byString} ${Translator.translate("ADDED", this.props.lang)} ${forString}`;
            break;
            case CometChat.ACTION_TYPE.MEMBER_JOINED:
                actionMessage = `${byString} ${Translator.translate("JOINED", this.props.lang)}`;
            break;
            case CometChat.ACTION_TYPE.MEMBER_LEFT:
                actionMessage = `${byString} ${Translator.translate("LEFT", this.props.lang)}`;
            break;
            case CometChat.ACTION_TYPE.MEMBER_KICKED:
                actionMessage = `${byString} ${Translator.translate("KICKED", this.props.lang)} ${forString}`;
            break;
            case CometChat.ACTION_TYPE.MEMBER_BANNED:
                actionMessage = `${byString} ${Translator.translate("BANNED", this.props.lang)} ${forString}`;
            break;
            case CometChat.ACTION_TYPE.MEMBER_UNBANNED:
                actionMessage = `${byString} ${Translator.translate("UNBANNED", this.props.lang)} ${forString}`;
            break;
            case CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED: {
                const newScope = message["extras"]["scope"]["new"];
                actionMessage = `${byString} ${Translator.translate("MADE", this.props.lang)} ${forString} ${Translator.translate(newScope, this.props.lang)}`;
                break;
            }
            default:
            break;
        }

        return actionMessage;
    }

    render () {

        return (
            <div css={actionMessageStyle()} className="action__message">
                <p css={actionMessageTxtStyle()}>{this.getMessage(this.props.message)}</p>
            </div>
        )
    }
}

// Specifies the default values for props:
ActionMessage.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme,
};

ActionMessage.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object,
}

export default ActionMessage; 