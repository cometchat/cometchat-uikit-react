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
    <div css={listItem(props)} onClick={() => props.clickeHandler(props.user)} className="list__item">
      <div css={itemThumbnailStyle()} className="list__item__thumbnail">
        <Avatar 
        image={props.user.avatar} 
        cornerRadius="50%" 
        borderColor={props.theme.color.secondary}
        borderWidth="1px" />
        {userPresence}
      </div>
      <div css={itemDetailStyle()} className="list__item__details">
        <div css={itemNameStyle()} className="item__details__name"  
        onMouseEnter={event => toggleTooltip(event, true)} 
        onMouseLeave={event => toggleTooltip(event, false)}>{props.user.name}</div>
        <div css={itemDescStyle(props.theme)} className="item__details__desc"></div>
      </div>
    </div>
  )
}

export default userview;
