import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import {
  messageActionStyle,
  actionGroupStyle,
  groupButtonStyle
} from "./style";

import replyIcon from "./resources/reply.svg";

const tooltip = (props) => {

  const toggleTooltip = (event, flag) => {

    const elem = event.target;
    const toolTipLabel = (props.message.replyCount) ? "Reply to thread" : "Reply in thread";

    if(flag) {
      elem.setAttribute("title", toolTipLabel);
    } else {
      elem.removeAttribute("title");
    }
  }

  let tooltip = (
    <ul css={messageActionStyle(props)}>
      <li css={actionGroupStyle(props)}>
        <button 
        type="button" 
        onMouseEnter={event => toggleTooltip(event, true)} 
        onMouseLeave={event => toggleTooltip(event, false)}
        css={groupButtonStyle(replyIcon)} 
        onClick={() => props.actionGenerated(props.action, props.message)}></button>
      </li>
    </ul>
  );

  if(props.hasOwnProperty("widgetconfig") 
  && props.widgetconfig
  && props.widgetconfig.hasOwnProperty("threaded-chats")
  && props.widgetconfig["threaded-chats"] === false) {
    tooltip = null;
  }

  if(props.hasOwnProperty("widgetsettings") 
  && props.widgetsettings
  && props.widgetsettings.hasOwnProperty("main")
  && props.widgetsettings.main.hasOwnProperty("enable_threaded_replies")
  && props.widgetsettings.main["enable_threaded_replies"] === false) {
    tooltip = null;
  }

  return tooltip;
}

export default tooltip;