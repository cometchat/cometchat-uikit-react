import { useState } from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";

import { CometChatAvatar, CometChatUserPresence } from "../../Shared";

import { theme } from "../../../resources/theme";

import {
  modalRowStyle,
  modalColumnStyle,
  avatarStyle,
  nameStyle,
  selectionColumnStyle,
  selectionBoxStyle
} from "./style";

import inactiveIcon from "./resources/checkbox-inactive.svg";
import activeIcon from "./resources/checkbox-blue-active.svg";

const CometChatAddGroupMemberListItem = (props) => {

  const [checked, setChecked] = useState(() => {
    const found = props.members.find(member => member.uid === props.user.uid);
    const value = (found) ? true : false;

    return value;
  });

  const handleCheck = (event) => {

    const value = (checked === true) ? false : true;
    setChecked(value);
    props.changed(props.user, value);
  }

  const toggleTooltip = (event, flag) => {

    const elem = event.currentTarget;
    const nameContainer = elem.lastChild;

    const scrollWidth = nameContainer.scrollWidth;
    const clientWidth = nameContainer.clientWidth;
    
    if(scrollWidth <= clientWidth) {
      return false;
    }

    if(flag) {
      nameContainer.setAttribute("title", nameContainer.textContent);
    } else {
      nameContainer.removeAttribute("title");
    }
  }
  
  return (
    <div css={modalRowStyle(props)}>
      <div css={modalColumnStyle()} className="userinfo"
      onMouseEnter={event => toggleTooltip(event, true)}
      onMouseLeave={event => toggleTooltip(event, false)}>
        <div css={avatarStyle()} className="avatar">
          <CometChatAvatar user={props.user} />
          <CometChatUserPresence
          widgetsettings={props.widgetsettings}
          status={props.user.status}
          borderColor={props.theme.borderColor.primary} />
        </div>
        <div css={nameStyle()} className="name">{props.user.name}</div>
      </div>
      <div css={selectionColumnStyle()} className="selection">
          <input 
          css={selectionBoxStyle(inactiveIcon, activeIcon)}
          type="checkbox" 
          checked={checked}
          id={props.user.uid+"sel"} 
          onChange={handleCheck}  />
          <label htmlFor={props.user.uid+"sel"}>&nbsp;</label>
      </div>
    </div>
  )
}

// Specifies the default values for props:
CometChatAddGroupMemberListItem.defaultProps = {
  theme: theme
};

CometChatAddGroupMemberListItem.propTypes = {
  theme: PropTypes.object
}

export default CometChatAddGroupMemberListItem;