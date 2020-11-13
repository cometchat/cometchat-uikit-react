/** @jsx jsx */
import { jsx } from '@emotion/core';

import Avatar from "../Avatar";

import {
  listItem,
  listItemIcon,
  itemThumbnailStyle,
  itemDetailStyle,
  itemNameWrapperStyle,
  itemDescStyle,
  listItemName  
} from "./style";

import shieldIcon from "./resources/shield.png";
import lockIcon from "./resources/lock.png";

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

    groupTypeIcon = (<img src={shieldIcon} alt="Private Group" />);

  } else if(props.group.type === "password") {

    groupTypeIcon = (<img src={lockIcon} alt="Protected Group" />);
  }

  return (
    <div css={listItem(props)} className="list__item" onClick={() => props.clickHandler(props.group)}>
      <div css={itemThumbnailStyle()} className="list__item__thumbnail">
        <Avatar 
        image={props.group.icon} 
        cornerRadius="18px" 
        borderColor={props.theme.color.secondary}
        borderWidth="1px" />
      </div>
      <div css={itemDetailStyle()} className="list__item__details">
        <div css={itemNameWrapperStyle()} className="item__details__name"
        onMouseEnter={event => toggleTooltip(event, true)} 
        onMouseLeave={event => toggleTooltip(event, false)}> 
          <span css={listItemName()}>{props.group.name}</span>
          <span css={listItemIcon()}>{groupTypeIcon}</span>
        </div>
        <div css={itemDescStyle(props)} className="item__details__desc">{props.group.membersCount} members</div>
      </div>
    </div>
  )
}

export default groupview;