import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatViewGroupMemberListItem } from "../../Groups";
import { CometChatBackdrop } from "../../Shared";

import * as enums from "../../../util/enums.js";
import { CometChatContext } from "../../../util/CometChatContext";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
    modalWrapperStyle,
    modalCloseStyle,
    modalBodyStyle,
    modalCaptionStyle,
    modalListStyle,
    listHeaderStyle,
    listStyle,
    nameColumnStyle,
    scopeColumnStyle,
    actionColumnStyle,
    modalErrorStyle
} from "./style";

import clearIcon from "./resources/close.svg";

class CometChatViewGroupMemberList extends React.Component {

    static contextType = CometChatContext;

    constructor(props, context) {

        super(props, context);
        this._isMounted = false;
        const chatWindow = context.UIKitSettings.chatWindow;
        this.mq = chatWindow.matchMedia(this.context.theme.breakPoints[1]);
        
        let userColumnTitle = Translator.translate("NAME", context.language);
        if (this.mq.matches) {
            userColumnTitle = Translator.translate("AVATAR", context.language)
        }

        this.state = {
            userColumnTitle: userColumnTitle,
            errorMessage: ""
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    handleScroll = (e) => {

        const bottom = Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
        if (bottom) {
            this.props.actionGenerated(enums.ACTIONS["FETCH_GROUP_MEMBERS"]);
        }
    }

    updateMembers = (action, member, scope) => {

        switch(action) {
            case enums.ACTIONS["BAN_GROUP_MEMBER"]:
                this.banMember(member);
                break;
            case enums.ACTIONS["KICK_GROUP_MEMBER"]:
                this.kickMember(member);
                break;
            case enums.ACTIONS["CHANGE_SCOPE_GROUP_MEMBER"]:
                this.changeScope(member, scope);
                break;
            default:
                break;
        }
    }

    banMember = (memberToBan) => {

        const guid = this.context.item.guid;
        CometChat.banGroupMember(guid, memberToBan.uid).then(response => {
            
            if(response) {

                this.context.setToastMessage("success", "BAN_GROUPMEMBER_SUCCESS");
                this.props.actionGenerated(enums.ACTIONS["BAN_GROUPMEMBER_SUCCESS"], memberToBan);

            } else {
                this.setState({ errorMessage: Translator.translate("SOMETHING_WRONG", this.context.language) });
            }

        }).catch(error => this.setState({ errorMessage: Translator.translate("SOMETHING_WRONG", this.context.language) }));
    }

    kickMember = (memberToKick) => {

        const guid = this.context.item.guid;
        CometChat.kickGroupMember(guid, memberToKick.uid).then(response => {
            
            if(response) {
                this.props.actionGenerated(enums.ACTIONS["KICK_GROUPMEMBER_SUCCESS"], memberToKick);
            } else {
                this.setState({ errorMessage: Translator.translate("SOMETHING_WRONG", this.context.language) });
            }
            
        }).catch(error => this.setState({ errorMessage: Translator.translate("SOMETHING_WRONG", this.context.language) }));
    }

    changeScope = (member, scope) => {

        const guid = this.context.item.guid;
        CometChat.updateGroupMemberScope(guid, member.uid, scope).then(response => {
            
            if(response) {

                this.context.setToastMessage("success", "SCOPECHANGE_GROUPMEMBER_SUCCESS");
                const updatedMember = Object.assign({}, member, {scope: scope});
                this.props.actionGenerated(enums.ACTIONS["SCOPECHANGE_GROUPMEMBER_SUCCESS"], updatedMember);
            } else {
                this.setState({ errorMessage: Translator.translate("SOMETHING_WRONG", this.context.language) });
            }
            
        }).catch(error => this.setState({ errorMessage: Translator.translate("SOMETHING_WRONG", this.context.language) }));
    }

    setUserColumnTitle = (editAccess) => {

        if (this._isMounted) {
            
            if (editAccess !== null && this.mq.matches) {
                this.setState({ userColumnTitle: Translator.translate("AVATAR", this.context.language) });
            } else {
                this.setState({ userColumnTitle: Translator.translate("NAME", this.context.language) });
            }
        }
    }

    render() {

        const membersList = [...this.context.groupMembers];
        
        const groupMembers = membersList.map((member, key) => {
        
            return (
                <CometChatViewGroupMemberListItem
                    loggedinuser={this.props.loggedinuser}
                    theme={this.props.theme}
                    key={key}
                    member={member}
                    enableChangeScope={this.props.enableChangeScope}
                    enableBanGroupMembers={this.props.enableBanGroupMembers}
                    enableKickGroupMembers={this.props.enableKickGroupMembers}
                    actionGenerated={this.updateMembers} />
            );
        });

        let editAccess = null;
        if(this.context.item.scope !== CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {

            editAccess = (
                <React.Fragment>
                    <div css={actionColumnStyle(this.context)} className="ban">{Translator.translate("BAN", this.context.language)}</div>
                    <div css={actionColumnStyle(this.context)} className="kick">{Translator.translate("KICK", this.context.language)}</div>
                </React.Fragment>
            );

            if (this.props.enableKickGroupMembers === false && this.props.enableBanGroupMembers === false) {
                editAccess = null;
            }
        }

        this.mq.addListener(editAccess => this.setUserColumnTitle(editAccess));

        return (
            <React.Fragment>
                <CometChatBackdrop show={true} clicked={this.props.close} />
                <div css={modalWrapperStyle(this.context)} className="modal__viewmembers">
                    <span css={modalCloseStyle(clearIcon, this.context)} className="modal__close" onClick={this.props.close} title={Translator.translate("CLOSE", this.context.language)}></span>
                    <div css={modalBodyStyle()} className="modal__body">
                        <div css={modalCaptionStyle(Translator.getDirection(this.context.language))} className="modal__title">{Translator.translate("GROUP_MEMBERS", this.context.language)}</div>
                        <div css={modalErrorStyle(this.context)} className="modal__error">{this.state.errorMessage}</div>
                        <div css={modalListStyle()} className="modal__content">
                            <div css={listHeaderStyle(this.context)} className="content__header">
                                <div css={nameColumnStyle(this.context, editAccess)} className="name">{this.state.userColumnTitle}</div>
                                <div css={scopeColumnStyle(this.context)} className="scope">{Translator.translate("SCOPE", this.context.language)}</div>
                                {editAccess}
                            </div>
                            <div css={listStyle()} className="content__list" onScroll={this.handleScroll}>
                                {groupMembers}
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

// Specifies the default values for props:
CometChatViewGroupMemberList.defaultProps = {
	theme: theme,
	userColumnTitle: "",
	enableChangeScope: false,
	enableKickGroupMembers: false,
	enableBanGroupMembers: false
};

CometChatViewGroupMemberList.propTypes = {
	theme: PropTypes.object,
	userColumnTitle: PropTypes.string,
	enableChangeScope: PropTypes.bool,
	enableKickGroupMembers: PropTypes.bool,
	enableBanGroupMembers: PropTypes.bool
};

export { CometChatViewGroupMemberList };