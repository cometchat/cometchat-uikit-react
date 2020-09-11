import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { replyCountStyle } from "./style";

const replycount = (props) => {

    const replyCount = props.message.replyCount;
    const replyText = (replyCount === 1) ? `${replyCount} reply` : `${replyCount} replies`;

    let replies = (<span css={replyCountStyle(props)} onClick={() => props.actionGenerated(props.action, props.message)}>{replyText}</span>);

    if(props.message.hasOwnProperty("replyCount") === false) {
        replies = null;
    }

    if(props.hasOwnProperty("widgetconfig") 
    && props.widgetconfig
    && props.widgetconfig.hasOwnProperty("threaded-chats")
    && props.widgetconfig["threaded-chats"] === false) {
        replies = null;
    }

    if(props.hasOwnProperty("widgetsettings") 
    && props.widgetsettings
    && props.widgetsettings.hasOwnProperty("main")
    && props.widgetsettings.main.hasOwnProperty("enable_threaded_replies")
    && props.widgetsettings.main["enable_threaded_replies"] === false) {
        replies = null;
    }

    return replies;
}

export default replycount;