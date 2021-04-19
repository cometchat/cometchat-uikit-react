import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatBanGroupMemberListItem } from "../";
import { CometChatBackdrop } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

import {
    modalWrapperStyle,
    modalCloseStyle,
    modalBodyStyle,
    modalTableStyle,
    tableCaptionStyle,
    tableBodyStyle,
    roleColumnStyle,
    actionColumnStyle,
    contactMsgStyle,
    contactMsgTxtStyle
} from "./style";

import clearIcon from "./resources/close.png";

class CometChatBanGroupMemberList extends React.Component {

    loggedInUser = null;
    decoratorMessage = Translator.translate("LOADING", Translator.getDefaultLanguage());
    static contextType = CometChatContext;

    constructor(props) {

        super(props);

        this.state = {
            membersToBan: [],
            membersToUnBan: [],
        }

        CometChat.getLoggedinUser().then(user => this.loggedInUser = user).catch(error => {
            console.error(error);
        });
    }

    unbanMember = (memberToUnBan) => {

        const guid = this.context.item.guid;
        CometChat.unbanGroupMember(guid, memberToUnBan.uid).then(response => {
            
            if(response) {

                this.context.setToastMessage("success", "UNBAN_GROUP_MEMBER_SUCCESS");
                this.props.actionGenerated(enums.ACTIONS["UNBAN_GROUP_MEMBER_SUCCESS"], [memberToUnBan]);
            } else {
                this.context.setToastMessage("error", "UNBAN_GROUP_MEMBER_FAIL");
            }

        }).catch(error => {
            const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
            this.context.setToastMessage("error", errorCode);
        });
    }

    updateMembers = (action, member) => {

        switch(action) {
            case enums.ACTIONS["UNBAN_GROUP_MEMBER"]:
                this.unbanMember(member);
                break;
            default:
                break;
        }
    }

    handleScroll = (e) => {

        const bottom = Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
        if (bottom) {
            this.props.actionGenerated(enums.ACTIONS["FETCH_BANNED_GROUP_MEMBERS"]);
        }
    }
    
    render() {
        
        const membersList = [...this.context.bannedGroupMembers];
        const bannedMembers = membersList.map((member, key) => {

            return (
                <CometChatBanGroupMemberListItem 
                theme={this.props.theme}
                key={key} 
                member={member}
                loggedinuser={this.loggedInUser}
                lang={this.props.lang}
                widgetsettings={this.props.widgetsettings}
                actionGenerated={this.updateMembers} />);

        });

        let messageContainer = null;
        if (bannedMembers.length === 0) {

            this.decoratorMessage = Translator.translate("NO_BANNED_MEMBERS_FOUND", this.props.lang);
            messageContainer = (
                <caption css={contactMsgStyle()} className="bannedmembers__decorator-message">
                    <p css={contactMsgTxtStyle(this.props)} className="decorator-message">{this.decoratorMessage}</p>
                </caption>
            );
        }
        
        return (
            <React.Fragment>
                <CometChatBackdrop show={this.props.open} clicked={this.props.close} />
                <div css={modalWrapperStyle(this.props)} className="modal__bannedmembers">
                    <span css={modalCloseStyle(clearIcon)} className="modal__close" onClick={this.props.close} title={Translator.translate("CLOSE", this.props.lang)}></span>
                    <div css={modalBodyStyle()} className="modal__body">
                        <table css={modalTableStyle(this.props)}>
                            <caption css={tableCaptionStyle(Translator.getDirection(this.props.lang))} className="modal__title">{Translator.translate("BANNED_MEMBERS", this.props.lang)}</caption>
                            <thead>
                                <tr>
                                    <th className="name">{Translator.translate("NAME", this.props.lang)}</th>
                                    <th css={roleColumnStyle()} className="role">{Translator.translate("SCOPE", this.props.lang)}</th>
                                    <th css={actionColumnStyle()} className="unban">{Translator.translate("UNBAN", this.props.lang)}</th>
                                </tr>
                            </thead>
                            {messageContainer}
                            <tbody css={tableBodyStyle()} onScroll={this.handleScroll}>{bannedMembers}</tbody>
                        </table>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

// Specifies the default values for props:
CometChatBanGroupMemberList.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme
};

CometChatBanGroupMemberList.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object
}

export default CometChatBanGroupMemberList;