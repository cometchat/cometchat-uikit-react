import React from "react";

import { CometChat } from "@cometchat-pro/chat";

import Avatar from "../Avatar";
import StatusIndicator from "../StatusIndicator";

import unban from "./resources/block.svg";

import "./style.scss";

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
    
    return (
        <tr>
            <td data-label="Name">
            <span className="avatar">
            <Avatar 
            image={props.member.avatar} 
            cornerRadius="18px" 
            borderColor="#CCC"
            borderWidth="1px" />
            <StatusIndicator
            status={props.member.status}
            cornerRadius="50%" 
            borderColor="rgb(238, 238, 238)" 
            borderWidth="1px" />
            </span>
            <span className="name">{name}</span>
            </td>
            <td data-label="Scope" className="role">{scope}</td>
            <td data-label="Unban" className="unban"><span>{unBan}</span></td>
        </tr>
    );
}

export default memberview;