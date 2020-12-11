/** @jsx jsx */
import { jsx } from '@emotion/core';

import { validateWidgetSettings } from "../../util/common";

import { replyCountStyle } from "./style";

const replycount = (props) => {

    const replyCount = props.message.replyCount;
    const replyText = (replyCount === 1) ? `${replyCount} reply` : `${replyCount} replies`;

    let replies = (<span css={replyCountStyle(props)} className="replycount" onClick={() => props.actionGenerated("viewMessageThread", props.message)}>{replyText}</span>);

    if(props.message.hasOwnProperty("replyCount") === false) {
        replies = null;
    }


    //if threadedchats are disabled in chat widget
    if (validateWidgetSettings(props.widgetconfig, "threaded-chats") === false) {
        replies = null;
    }

    //if threadedchats are disabled in chat widget
    if (validateWidgetSettings(props.widgetsettings, "enable_threaded_replies") === false) {
        replies = null;
    }

    return replies;
}

export default replycount;