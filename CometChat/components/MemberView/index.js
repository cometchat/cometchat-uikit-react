import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { CometChat } from "@cometchat-pro/chat";

import Avatar from "../Avatar";
import StatusIndicator from "../StatusIndicator";

import GroupDetailContext from '../CometChatGroupDetail/context';

import {
    tableRowStyle,
    tableColumnStyle,
    avatarStyle,
    nameStyle,
    roleStyle,
    scopeStyle,
    actionColumnStyle,
    scopeWrapperStyle,
    scopeSelectionStyle
} from "./style";

import scopeIcon from "./resources/create.svg";
import doneIcon from "./resources/done.svg";
import clearIcon from "./resources/clear.svg";
import banIcon from "./resources/block.svg";
import kickIcon from "./resources/delete.svg";

class MemberView extends React.Component {

    static contextType = GroupDetailContext;

    constructor(props) {
        super(props);

        this.changeScopeDropDown = (
            <select 
            className="members-scope-select"
            onChange={this.scopeChangeHandler}
            defaultValue={this.props.member.scope}></select>
        )

        this.roles = {}
        this.roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN] = "Administrator";
        this.roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR] = "Moderator";
        this.roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT] = "Participant";
    }
    
    state = {
        showChangeScope: false,
        scope: null
    }

    toggleChangeScope = (flag) => {
        this.setState({ showChangeScope: flag });
    }

    scopeChangeHandler = (event) => {
        this.setState({scope: event.target.value});
    }

    updateMemberScope = () => {
        this.props.actionGenerated("changescope", this.props.member, this.state.scope);
        this.toggleChangeScope();
    }

    toggleTooltip = (event, flag) => {

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

    render() {

        const group = this.context;

        let editClassName = "";
    
        let name = this.props.member.name;
        let scope = (<span css={roleStyle()}>{this.roles[this.props.member.scope]}</span>);
        let changescope = null;
        let ban = (<img src={banIcon} alt="Ban" onClick={() => {this.props.actionGenerated("ban", this.props.member)}} />);
        let kick = (<img src={kickIcon} alt="Kick" onClick={() => {this.props.actionGenerated("kick", this.props.member)}} />);
        

        if(this.state.showChangeScope) {

            let options = (
                <React.Fragment>
                    <option value={CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT}>{this.roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT]}</option>
                    <option value={CometChat.GROUP_MEMBER_SCOPE.MODERATOR}>{this.roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR]}</option>
                    <option value={CometChat.GROUP_MEMBER_SCOPE.ADMIN}>{this.roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN]}</option>
                </React.Fragment>
            );

            if (this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR
                && this.props.member.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {

                options = (
                    <React.Fragment>
                        <option value={CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT}>{this.roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT]}</option>
                        <option value={CometChat.GROUP_MEMBER_SCOPE.MODERATOR}>{this.roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR]}</option>
                    </React.Fragment>
                );
            }

            changescope = (
                <div css={scopeWrapperStyle()}>
                    <select 
                    css={scopeSelectionStyle()}
                    onChange={this.scopeChangeHandler}
                    defaultValue={this.props.member.scope}>{options}</select>
                    <img src={doneIcon} alt="Change Scope" onClick={this.updateMemberScope} />
                    <img src={clearIcon} alt="Change Scope" onClick={() => this.toggleChangeScope(false)} />
                </div>
            );

        } else {

            if(this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
                changescope = scope;
            } else {
                changescope = (
                    <React.Fragment>
                        {scope}
                        <img src={scopeIcon} alt="Change Scope" onClick={() => this.toggleChangeScope(true)} />
                    </React.Fragment>
                );
            }
        }

        //disable change scope, kick, ban of group owner
        if(this.props.item.owner === this.props.member.uid) {
            scope = (<span css={roleStyle()}>{"Owner"}</span>);
            changescope = scope;
            ban = null;
            kick = null;
        }

        //disable change scope, kick, ban of self
        if(group.loggedinuser.uid === this.props.member.uid) {
            name = "You";
            changescope = scope;
            ban = null;
            kick = null;
        }

        //if the loggedin user is moderator, don't allow to change scope, ban, kick group moderators or administrators
        if(this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR 
        && (this.props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN || this.props.member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR)) {
            changescope = scope;
            ban = null;
            kick = null;
        }

        //if the loggedin user is administrator but not group owner, don't allow to change scope, ban, kick group administrators
        if(this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN
        && this.props.item.owner !== group.loggedinuser.uid 
        && this.props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
            changescope = scope;
            ban = null;
            kick = null;
        }
        
        let editAccess = null;
        //if the loggedin user is participant, don't show change scope, ban, kick group members
        if(this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
            editAccess = null;
            editClassName = "true";
        } else {

            editAccess = (
                <React.Fragment>
                    <td css={actionColumnStyle()}><span>{ban}</span></td>
                    <td css={actionColumnStyle()}><span>{kick}</span></td>
                </React.Fragment>
            );

            if(this.props.hasOwnProperty("widgetsettings") && this.props.widgetsettings && this.props.widgetsettings.hasOwnProperty("main")) {
    
                //if kick_ban_members is disabled in chatwidget
                if (this.props.widgetsettings.main.hasOwnProperty("allow_kick_ban_members")
                && this.props.widgetsettings.main["allow_kick_ban_members"] === false) {
    
                    editAccess = null;//(<td data-label="Change Scope" className="changescope">{changescope}</td>);
                }

                //if promote_demote_members is disabled in chatwidget
                if (this.props.widgetsettings.main.hasOwnProperty("allow_promote_demote_members")
                && this.props.widgetsettings.main["allow_promote_demote_members"] === false) {
    
                    changescope = scope;
                }
            }
        }

        let userPresence = (
            <StatusIndicator
            widgetsettings={this.props.widgetsettings}
            status={this.props.member.status}
            cornerRadius="50%" 
            borderColor={this.props.theme.color.darkSecondary}
            borderWidth="1px" />
        );
        
        return (
            <tr css={tableRowStyle(this.props)}>
                <td css={tableColumnStyle(editClassName)} 
                onMouseEnter={event => this.toggleTooltip(event, true)}
                onMouseLeave={event => this.toggleTooltip(event, false)}>
                    <div css={avatarStyle(editClassName)}>
                        <Avatar 
                        image={this.props.member.avatar} 
                        cornerRadius="18px" 
                        borderColor={this.props.theme.color.secondary}
                        borderWidth="1px" />
                        {userPresence}
                    </div>
                    <div css={nameStyle(editClassName)}>{name}</div>
                </td>
                <td css={scopeStyle()}>{changescope}</td>
                {editAccess}
            </tr>
        );
    }
}

export default MemberView;