import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core"
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatBanGroupMemberListItem } from "../";
import { CometChatBackdrop } from "../../Shared";
import GroupDetailContext from "../CometChatGroupDetails/context";

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

    static contextType = GroupDetailContext;

    constructor(props) {

        super(props);

        this.decoratorMessage = Translator.translate("LOADING", props.lang);

        this.state = {
            membersToBan: [],
            membersToUnBan: [],
        }
    }

    unbanMember = (memberToUnBan) => {

        const group = this.context;

        const guid = group.item.guid;
        CometChat.unbanGroupMember(guid, memberToUnBan.uid).then(response => {
            
            if(response) {
                console.log("Group member unbanning success with response", response);
                this.props.actionGenerated("unbanGroupMembers", [memberToUnBan]);
            }
        }).catch(error => {
            console.log("Group member banning failed with error", error);
        });
    }

    updateMembers = (action, member) => {

        switch(action) {
            case "unban":
                this.unbanMember(member);
                break;
            default:
                break;
        }
    }

    handleScroll = (e) => {
        const bottom = Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
        if (bottom) {
            this.props.actionGenerated("fetchBannedMembers");
        }
    }
    
    render() {
        
        const group = this.context;
        const membersList = [...group.bannedmemberlist];
        const bannedMembers = membersList.map((member, key) => {

            return (<CometChatBanGroupMemberListItem 
                    theme={this.props.theme}
                    key={key} 
                    member={member}
                    item={this.props.item}
                    loggedinuser={group.loggedinuser}
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