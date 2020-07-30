import React from "react";
import "./style.scss";

const tooltip = (props) => {

    return (
        <div className="cc1-chat-win-msg-actions">
        <div className="cc1-chat-win-msg-action-group">
          <button 
          type="button" 
          title={(props.message.replyCount) ? "Reply to thread" : "Reply in thread"}
          className="cc1-chat-win-msg-action-button reply" 
          onClick={() => props.actionGenerated(props.action, props.message)}></button>
        </div>
      </div>
    );
}

export default tooltip;