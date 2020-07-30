import React from "react";
import "./style.scss";

const replycount = (props) => {

    const replyCount = props.message.replyCount;
    const replyText = (replyCount === 1) ? `${replyCount} reply` : `${replyCount} replies`;

    return (
        <span className="cc1-chat-win-replies" onClick={() => props.actionGenerated(props.action, props.message)}>{replyText}</span>
    );
}

export default replycount;