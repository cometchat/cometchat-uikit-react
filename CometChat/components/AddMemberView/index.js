import React, { useState } from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import Avatar from "../Avatar";
import StatusIndicator from "../StatusIndicator";

import {
  tableRowStyle,
  tableColumnStyle,
  avatarStyle,
  nameStyle,
  selectionColumnStyle,
  selectionBoxStyle
} from "./style";

import inactiveIcon from "./resources/checkbox-inactive.svg";
import activeIcon from "./resources/checkbox-blue-active.svg";

const AddMemberView = (props) => {

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
    <tr css={tableRowStyle(props)}>
      <td css={tableColumnStyle()}
      onMouseEnter={event => toggleTooltip(event, true)}
      onMouseLeave={event => toggleTooltip(event, false)}>
        <div css={avatarStyle()}>
          <Avatar 
          image={props.user.avatar} 
          cornerRadius="50%" 
          borderColor={props.theme.color.secondary}
          borderWidth="1px" />
          <StatusIndicator
          widgetsettings={props.widgetsettings}
          status={props.user.status}
          cornerRadius="50%" 
          borderColor={props.theme.color.darkSecondary}
          borderWidth="1px" />
        </div>
        <div css={nameStyle()}>{props.user.name}</div>
      </td>
      <td css={selectionColumnStyle()}>
          <input 
          css={selectionBoxStyle(inactiveIcon, activeIcon)}
          type="checkbox" 
          checked={checked}
          id={props.user.uid+"sel"} 
          onChange={handleCheck}  />
          <label htmlFor={props.user.uid+"sel"}>&nbsp;</label>
      </td>
    </tr>
  )
}

export default AddMemberView;