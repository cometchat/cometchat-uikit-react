/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatAvatar, CometChatUserPresence } from "../../Shared";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import { listItem, itemThumbnailStyle, itemDetailStyle, itemNameStyle, itemDescStyle } from "./style";

const CometChatUserListItem = (props) => {

  let userPresence = (
    <CometChatUserPresence
    widgetsettings={props.widgetsettings}
    status={props.user.status}
    borderColor={props.theme.borderColor.primary} />
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
    <div css={listItem(props)} onClick={() => props.clickHandler(props.user)} className="list__item">
      <div css={itemThumbnailStyle()} className="list__item__thumbnail">
        <CometChatAvatar user={props.user} />
        {userPresence}
      </div>
      <div css={itemDetailStyle()} className="list__item__details" dir={Translator.getDirection(props.lang)}>
        <div css={itemNameStyle()} className="item__details__name"  
        onMouseEnter={event => toggleTooltip(event, true)} 
        onMouseLeave={event => toggleTooltip(event, false)}>{props.user.name}</div>
        <div css={itemDescStyle(props.theme)} className="item__details__desc"></div>
      </div>
    </div>
  )
}

// Specifies the default values for props:
CometChatUserListItem.defaultProps = {
  theme: theme,
  user: {}
};

CometChatUserListItem.propTypes = {
  theme: PropTypes.object,
  user: PropTypes.shape(CometChat.User)
}

export default CometChatUserListItem;
