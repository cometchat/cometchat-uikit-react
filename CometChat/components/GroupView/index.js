import React from "react";
/** @jsx jsx */
import { jsx } from '@emotion/core';

import Avatar from "../Avatar";

import {
  listItem,
  listItemIcon,
  itemThumbnailStyle,
  itemDetailStyle,
  itemNameStyle,
  itemDescStyle

} from "./style";

import shieldIcon from "./resources/shield.svg";
import lockIcon from "./resources/lock.svg";

const groupview = (props) => {

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

  let groupTypeIcon = null;
  if(props.group.type === "private") {

    groupTypeIcon = (<div css={listItemIcon()}><img src={shieldIcon} alt="time" /></div>);

  } else if(props.group.type === "password") {

    groupTypeIcon = (<div css={listItemIcon()}><img src={lockIcon} alt="time" /></div>);
  }

  return (
    <div css={listItem(props)} onClick={() => props.clickHandler(props.group)}>
      <div css={itemThumbnailStyle()}>
        <Avatar 
        image={props.group.icon} 
        cornerRadius="18px" 
        borderColor={props.theme.color.secondary}
        borderWidth="1px"></Avatar>
      </div>
      <div css={itemDetailStyle()}>
        <div css={itemNameStyle()}
        onMouseEnter={event => toggleTooltip(event, true)} 
        onMouseLeave={event => toggleTooltip(event, false)}>{props.group.name}</div>
        <div css={itemDescStyle(props)}></div>
      </div>
      {groupTypeIcon}
    </div>
  )
}

export default groupview;