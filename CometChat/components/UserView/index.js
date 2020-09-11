import React from "react";
/** @jsx jsx */
import { jsx } from '@emotion/core'

import Avatar from "../Avatar";
import StatusIndicator from "../StatusIndicator";

import { listItem, itemThumbnailStyle, itemDetailStyle, itemNameStyle, itemDescStyle } from "./style";

const userview = (props) => {

  let userPresence = (
    <StatusIndicator
    widgetsettings={props.widgetsettings}
    status={props.user.status}
    cornerRadius="50%" 
    borderColor={props.theme.color.darkSecondary}
    borderWidth="1px" />
  );

  const toggleTooltip = (event, flag) => {

    const elem = event.target;

    const scrollWidth = elem.scrollWidth;
    const clientWidth = elem.clientWidth;

    if(scrollWidth <= clientWidth) {
      return false;
    }

    if(flag) {
      elem.setAttribute("title", elem.textContent);
    } else {
      elem.removeAttribute("title");
    }
  } 
  
  return (
    <div css={listItem(props)} onClick={() => props.clickeHandler(props.user)}>
      <div css={itemThumbnailStyle()}>
        <Avatar 
        image={props.user.avatar} 
        cornerRadius="50%" 
        borderColor={props.theme.color.secondary}
        borderWidth="1px" />
        {userPresence}
      </div>
      <div css={itemDetailStyle()}>
        <div css={itemNameStyle()} 
        onMouseEnter={event => toggleTooltip(event, true)} 
        onMouseLeave={event => toggleTooltip(event, false)}>{props.user.name}</div>
        <div css={itemDescStyle(props.theme)}></div>
      </div>
    </div>
  )
}

export default userview;
