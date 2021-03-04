import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core"
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatAvatar, CometChatUserPresence } from "../../Shared";
import GroupDetailContext from "../CometChatGroupDetails/context";

import Translator from "../../../resources/localization/translator";

import {
    modalRowStyle,
    nameColumnStyle,
    avatarStyle,
    nameStyle,
    roleStyle,
    scopeColumnStyle,
    actionColumnStyle,
    scopeWrapperStyle,
    scopeSelectionStyle
} from "./style";

import scopeIcon from "./resources/edit.png";
import doneIcon from "./resources/done.png";
import clearIcon from "./resources/close.png";
import banIcon from "./resources/block.png";
import kickIcon from "./resources/delete.png";

class CometChatViewGroupMemberListItem extends React.Component {

    static contextType = GroupDetailContext;

    constructor(props) {

        super(props);

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

        this.roles = {}
        this.roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN] = Translator.translate("ADMINISTRATOR", props.lang);
        this.roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR] = Translator.translate("MODERATOR", props.lang);
        this.roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT] = Translator.translate("PARTICIPANT", props.lang);
    }

    componentDidUpdate(prevProps) {

        if (prevProps.lang !== this.props.lang) {

            this.roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN] = Translator.translate("ADMINISTRATOR", this.props.lang);
            this.roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR] = Translator.translate("MODERATOR", this.props.lang);
            this.roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT] = Translator.translate("PARTICIPANT", this.props.lang);
        }
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

        const group = this.context;

        let editClassName = "";
    
        let name = this.props.member.name;
        let scope = (<span css={roleStyle()}>{this.roles[this.props.member.scope]}</span>);
        let changescope = null;
        let ban = (<img src={banIcon} alt={Translator.translate("BAN", this.props.lang)} onClick={() => {this.props.actionGenerated("ban", this.props.member)}} />);
        let kick = (<img src={kickIcon} alt={Translator.translate("KICK", this.props.lang)} onClick={() => {this.props.actionGenerated("kick", this.props.member)}} />);
        

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
                <div css={scopeWrapperStyle()} className="scope__wrapper">
                    <select 
                    css={scopeSelectionStyle()}
                    className="scope__select"
                    onChange={this.scopeChangeHandler}
                    defaultValue={this.props.member.scope}>{options}</select>
                    <img src={doneIcon} alt={Translator.translate("CHANGE_SCOPE", this.props.lang)} onClick={this.updateMemberScope} />
                    <img src={clearIcon} alt={Translator.translate("CHANGE_SCOPE", this.props.lang)} onClick={() => this.toggleChangeScope(false)} />
                </div>
            );

        } else {

            if(this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
                changescope = scope;
            } else {
                changescope = (
                    <React.Fragment>
                        {scope}
                        <img src={scopeIcon} alt={Translator.translate("CHANGE_SCOPE", this.props.lang)} onClick={() => this.toggleChangeScope(true)} />
                    </React.Fragment>
                );
            }
        }

        //disable change scope, kick, ban of group owner
        if(this.props.item.owner === this.props.member.uid) {
            scope = (<span css={roleStyle()}>{Translator.translate("OWNER", this.props.lang)}</span>);
            changescope = scope;
            ban = null;
            kick = null;
        }

        //disable change scope, kick, ban of self
        if(group.loggedinuser.uid === this.props.member.uid) {
            name = Translator.translate("YOU", this.props.lang);
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
                    <div css={actionColumnStyle(this.props)} className="ban"><span>{ban}</span></div>
                    <div css={actionColumnStyle(this.props)} className="kick"><span>{kick}</span></div>
                </React.Fragment>
            );

            if(this.props.hasOwnProperty("widgetsettings") && this.props.widgetsettings && this.props.widgetsettings.hasOwnProperty("main")) {
    
                //if kick_ban_members is disabled in chatwidget
                if (this.props.widgetsettings.main.hasOwnProperty("allow_kick_ban_members")
                && this.props.widgetsettings.main["allow_kick_ban_members"] === false) {
                    editAccess = null;
                }

                //if promote_demote_members is disabled in chatwidget
                if (this.props.widgetsettings.main.hasOwnProperty("allow_promote_demote_members")
                && this.props.widgetsettings.main["allow_promote_demote_members"] === false) {
                    changescope = scope;
                }
            }
        }

        let userPresence = (
            <CometChatUserPresence
            widgetsettings={this.props.widgetsettings}
            status={this.props.member.status}
            borderColor={this.props.theme.borderColor.primary} />
        );
        
        return (
            <div css={modalRowStyle(this.props)} className="content__row">
                <div css={nameColumnStyle(this.props, editClassName)} className="userinfo">
                    <div css={avatarStyle(this.props, editClassName)} className="thumbnail"
                    onMouseEnter={event => this.toggleTooltip(event, true)}
                    onMouseLeave={event => this.toggleTooltip(event, false)}>
                        <CometChatAvatar user={this.props.member} />
                        {userPresence}
                    </div>
                    <div css={nameStyle(this.props, editClassName)} className="name"
                    onMouseEnter={event => this.toggleTooltip(event, true)}
                    onMouseLeave={event => this.toggleTooltip(event, false)}>{name}</div>
                </div>
                <div css={scopeColumnStyle(this.props)} className="scope">{changescope}</div>
                {editAccess}
            </div>
        );
    }
}

// Specifies the default values for props:
CometChatViewGroupMemberListItem.defaultProps = {
    lang: Translator.getDefaultLanguage(),
};

CometChatViewGroupMemberListItem.propTypes = {
    lang: PropTypes.string,
}

export default CometChatViewGroupMemberListItem;