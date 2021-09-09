import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatAvatar, CometChatUserPresence } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";

import Translator from "../../../resources/localization/translator";

import {
    modalRowStyle,
    nameColumnStyle,
    avatarStyle,
    nameStyle,
    roleStyle,
    scopeColumnStyle,
    scopeIconStyle,
    actionColumnStyle,
    banIconStyle,
    kickIconStyle,
    scopeWrapperStyle,
    scopeSelectionStyle
} from "./style";

import scopeIcon from "./resources/edit.svg";
import doneIcon from "./resources/done.svg";
import clearIcon from "./resources/close.svg";
import banIcon from "./resources/ban-member.svg";
import kickIcon from "./resources/delete.svg";

class CometChatViewGroupMemberListItem extends React.Component {

    static contextType = CometChatContext;

    constructor(props, context) {

        super(props, context);

        this.changeScopeDropDown = (
            <select 
            className="members-scope-select"
            onChange={this.scopeChangeHandler}
            defaultValue={this.props.member.scope}></select>
        )

        this.state = {
            showChangeScope: false,
            scope: null
        }

        this.roles = context.roles;
    }

    toggleChangeScope = (flag) => {
        this.setState({ showChangeScope: flag });
    }

    scopeChangeHandler = (event) => {
        this.setState({scope: event.target.value});
    }

    updateMemberScope = () => {
        this.props.actionGenerated(enums.ACTIONS["CHANGE_SCOPE_GROUP_MEMBER"], this.props.member, this.state.scope);
        this.toggleChangeScope();
    }

    toggleTooltip = (event, flag) => {

        const elem = event.currentTarget;
        
        if (elem.classList.contains("name")) {

            const scrollWidth = elem.scrollWidth;
            const clientWidth = elem.clientWidth;
            
            if (scrollWidth <= clientWidth) {
                return false;
            }
        }

        if(flag) {
            elem.setAttribute("title", this.props.member.name);
        } else {
            elem.removeAttribute("title");
        }
    }

    render() {

        let editClassName = "";
    
        let name = this.props.member.name;
        let scope = <span css={roleStyle()}>{this.context.roles[this.props.member.scope]}</span>;
        let changescope = null;
        let ban = (<i css={banIconStyle(banIcon, this.context)} title={Translator.translate("BAN", this.context.language)} onClick={() => { this.props.actionGenerated(enums.ACTIONS["BAN_GROUP_MEMBER"], this.props.member)}}></i>);
        let kick = (<i css={kickIconStyle(kickIcon, this.context)} title={Translator.translate("KICK", this.context.language)} onClick={() => { this.props.actionGenerated(enums.ACTIONS["KICK_GROUP_MEMBER"], this.props.member)}}></i>);
        

        if(this.state.showChangeScope) {

            let options = (
                <React.Fragment>
                    <option value={CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT}>{this.context.roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT]}</option>
                    <option value={CometChat.GROUP_MEMBER_SCOPE.MODERATOR}>{this.context.roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR]}</option>
                    <option value={CometChat.GROUP_MEMBER_SCOPE.ADMIN}>{this.context.roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN]}</option>
                </React.Fragment>
            );

            if (this.context.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR
                && this.props.member.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {

                options = (
                    <React.Fragment>
                        <option value={CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT}>{this.context.roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT]}</option>
                        <option value={CometChat.GROUP_MEMBER_SCOPE.MODERATOR}>{this.context.roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR]}</option>
                    </React.Fragment>
                );
            }

            changescope = (
                <div css={scopeWrapperStyle()} className="scope__wrapper">
                    <select css={scopeSelectionStyle()} className="scope__select" onChange={this.scopeChangeHandler} defaultValue={this.props.member.scope}>
                        {options}
                    </select>
                    <i css={scopeIconStyle(doneIcon, this.context)} title={Translator.translate("CHANGE_SCOPE", this.context.language)} onClick={this.updateMemberScope}></i>
                    <i css={scopeIconStyle(clearIcon, this.context)} title={Translator.translate("CHANGE_SCOPE", this.context.language)} onClick={() => this.toggleChangeScope(false)}></i>
                </div>
            );

        } else {

            if (this.context.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
                changescope = scope;
            } else {
                changescope = (
                    <React.Fragment>
                        {scope}
                        <i css={scopeIconStyle(scopeIcon, this.context)} title={Translator.translate("CHANGE_SCOPE", this.context.language)} onClick={() => this.toggleChangeScope(true)}></i>
                    </React.Fragment>
                );
            }
        }

        //disable change scope, kick, ban of group owner
        if (this.context.item.owner === this.props.member.uid) {
            scope = (<span css={roleStyle()}>{Translator.translate("OWNER", this.context.language)}</span>);
            changescope = scope;
            ban = null;
            kick = null;
        }

        //disable change scope, kick, ban of self
        if (this.props.loggedinuser.uid === this.props.member.uid) {
            name = Translator.translate("YOU", this.context.language);
            changescope = scope;
            ban = null;
            kick = null;
        }

        //if the loggedin user is moderator, don't allow to change scope, ban, kick group moderators or administrators
        if (this.context.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR 
        && (this.props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN || this.props.member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR)) {
            changescope = scope;
            ban = null;
            kick = null;
        }

        //if the loggedin user is administrator but not group owner, don't allow to change scope, ban, kick group administrators
        if (this.context.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN
        && this.context.item.owner !== this.props.loggedinuser.uid 
        && this.props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
            changescope = scope;
            ban = null;
            kick = null;
        }
        
        let editAccess = null;
        //if the loggedin user is participant, don't show the option to change scope, ban, or kick group members
        if (this.context.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
            editAccess = null;
            editClassName = "true";
        } else {

            editAccess = (
                <React.Fragment>
                    <div css={actionColumnStyle(this.context)} className="ban">{ban}</div>
                    <div css={actionColumnStyle(this.context)} className="kick">{kick}</div>
                </React.Fragment>
            );

            /**
             * if kick and ban feature is disabled
             */
            if (this.props.enableBanGroupMembers === false && this.props.enableKickGroupMembers === false) {
                editAccess = null;
            } else if (this.props.enableBanGroupMembers === false) { //if ban feature is disabled
                editAccess = (
                    <div css={actionColumnStyle(this.context)} className="kick">{kick}</div>
                );
            } else if (this.props.enableKickGroupMembers === false) { //if kick feature is disabled
                editAccess = (
                    <div css={actionColumnStyle(this.context)} className="ban">{ban}</div>
                );
            }

            /**
             * if promote_demote_members feature is disabled
             */
            if (this.props.enableChangeScope === false) {
                changescope = scope;
            }
        }

        let userPresence = (
            <CometChatUserPresence status={this.props.member.status} />
        );
        
        return (
            <div css={modalRowStyle(this.context)} className="content__row">
                <div css={nameColumnStyle(this.context, editClassName)} className="userinfo">
                    <div css={avatarStyle(this.context, editClassName)} className="thumbnail"
                    onMouseEnter={event => this.toggleTooltip(event, true)}
                    onMouseLeave={event => this.toggleTooltip(event, false)}>
                        <CometChatAvatar user={this.props.member} />
                        {userPresence}
                    </div>
                    <div css={nameStyle(this.context, editClassName)} className="name"
                    onMouseEnter={event => this.toggleTooltip(event, true)}
                    onMouseLeave={event => this.toggleTooltip(event, false)}>{name}</div>
                </div>
                <div css={scopeColumnStyle(this.context)} className="scope">{changescope}</div>
                {editAccess}
            </div>
        );
    }
}

// Specifies the default values for props:
CometChatViewGroupMemberListItem.defaultProps = {
	loggedinuser: {},
	enableChangeScope: false,
};

CometChatViewGroupMemberListItem.propTypes = {
	loggedinuser: PropTypes.shape(CometChat.User),
	enableChangeScope: PropTypes.bool
};

export { CometChatViewGroupMemberListItem };