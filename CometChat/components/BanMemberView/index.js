import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { CometChat } from "@cometchat-pro/chat";

import Avatar from "../Avatar";
import StatusIndicator from "../StatusIndicator";

import {
    tableRowStyle,
    avatarStyle,
    nameStyle,
    roleStyle,
    actionStyle
} from "./style";

import unban from "./resources/block.svg";

const memberview = (props) => {

    const roles = {}
    roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN] = "Administrator";
    roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR] = "Moderator";
    roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT] = "Participant";

    let name = props.member.name;
    let scope = roles[props.member.scope];
    let unBan = (<img src={unban} alt="Unban" onClick={() => {props.actionGenerated("unban", props.member)}} />);

    //if the loggedin user is moderator, don't allow unban of banned moderators or administrators
    if(props.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR 
    && (props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN || props.member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR)) {
        unBan = null;
    }

    //if the loggedin user is administrator, don't allow unban of banned administrators
    if(props.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN && props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
        if(props.item.owner !== props.loggedinuser.uid) {
            unBan = null;
        }
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
            <td 
            onMouseEnter={event => toggleTooltip(event, true)}
            onMouseLeave={event => toggleTooltip(event, false)}>
                <div css={avatarStyle()}>
                    <Avatar 
                    image={props.member.avatar} 
                    cornerRadius="18px" 
                    borderColor={props.theme.borderColor.primary}
                    borderWidth="1px" />
                    <StatusIndicator
                    widgetsettings={props.widgetsettings}
                    status={props.member.status}
                    cornerRadius="50%" 
                    borderColor={props.theme.borderColor.primary}
                    borderWidth="1px" />
                </div>
                <div css={nameStyle()}>{name}</div>
            </td>
            <td css={roleStyle()}>{scope}</td>
            <td css={actionStyle()}>{unBan}</td>
        </tr>
    );
}

export default memberview;