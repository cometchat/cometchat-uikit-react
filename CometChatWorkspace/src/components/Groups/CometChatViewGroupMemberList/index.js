import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core"
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatViewGroupMemberListItem } from "../../Groups";
import { CometChatBackdrop } from "../../Shared";
import GroupDetailContext from "../CometChatGroupDetails/context";

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
    actionColumnStyle
} from "./style";

import clearIcon from "./resources/close.png";

class CometChatViewGroupMemberList extends React.Component {

    static contextType = GroupDetailContext;

    constructor(props) {

        super(props);

        this.mq = window.matchMedia(props.theme.breakPoints[1]);
        
        if (props.hasOwnProperty("widgetsettings") && props.widgetsettings) {
            const parentnode = (props.widgetsettings.hasOwnProperty("parentNode")) ? props.widgetsettings.parentNode : null;
            if (parentnode) {
                const window = parentnode.querySelector('iframe').contentWindow;
                this.mq = window.matchMedia(props.theme.breakPoints[1]);
            }
        }
        
        let userColumnTitle = Translator.translate("NAME", props.lang);
        if (this.mq.matches) {
            userColumnTitle = Translator.translate("AVATAR", props.lang)
        }

        this.state = {
            userColumnTitle: userColumnTitle
        }
    }

    handleScroll = (e) => {

        const bottom = Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
        if (bottom) {
            this.props.actionGenerated("fetchGroupMembers");
        }
    }

    updateMembers = (action, member, scope) => {

        switch(action) {
            case "ban":
                this.banMember(member);
                break;
            case "kick":
                this.kickMember(member);
                break;
            case "changescope":
                this.changeScope(member, scope);
                break;
            default:
                break;
        }
    }

    banMember = (memberToBan) => {

        const guid = this.props.item.guid;
        CometChat.banGroupMember(guid, memberToBan.uid).then(response => {
            
            if(response) {
                console.log("banGroupMember success with response: ", response);
                this.props.actionGenerated("removeGroupParticipants", memberToBan);
            }

        }).catch(error => {
            console.log("banGroupMember failed with error: ", error);
        });
    }

    kickMember = (memberToKick) => {

        const guid = this.props.item.guid;
        CometChat.kickGroupMember(guid, memberToKick.uid).then(response => {
            
            if(response) {
                console.log("kickGroupMember success with response: ", response);
                this.props.actionGenerated("removeGroupParticipants", memberToKick);
            }
            
        }).catch(error => {
            console.log("kickGroupMember failed with error: ", error);
        });
    }

    changeScope = (member, scope) => {

        const guid = this.props.item.guid;

        CometChat.updateGroupMemberScope(guid, member.uid, scope).then(response => {
            
            if(response) {
                console.log("updateGroupMemberScope success with response: ", response);
                const updatedMember = Object.assign({}, member, {scope: scope});
                this.props.actionGenerated("updateGroupParticipants", updatedMember);
            }
            
        }).catch(error => {
            console.log("updateGroupMemberScope failed with error: ", error);
        });
    }

    setUserColumnTitle = (editAccess) => {

        if (editAccess !== null && this.mq.matches) {
            this.setState({ userColumnTitle: Translator.translate("AVATAR", this.props.lang) });
        } else {
            this.setState({ userColumnTitle: Translator.translate("NAME", this.props.lang) });
        }
    }

    render() {

        const group = this.context;

        const membersList = [...group.memberlist];

        const groupMembers = membersList.map((member, key) => {
        
            return (<CometChatViewGroupMemberListItem 
                theme={this.props.theme}
                key={key} 
                member={member}
                item={this.props.item}
                lang={this.props.lang}
                widgetsettings={this.props.widgetsettings}
                actionGenerated={this.updateMembers} />);
        });

        let editAccess = null;
        if(this.props.item.scope !== CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {

            editAccess = (
                <React.Fragment>
                    <div css={actionColumnStyle(this.props)} className="ban">{Translator.translate("BAN", this.props.lang)}</div>
                    <div css={actionColumnStyle(this.props)} className="kick">{Translator.translate("KICK", this.props.lang)}</div>
                </React.Fragment>
            );

            if(this.props.hasOwnProperty("widgetsettings") && this.props.widgetsettings && this.props.widgetsettings.hasOwnProperty("main")) {

                //if kick_ban_members && promote_demote_members are disabled in chatwidget
                if(this.props.widgetsettings.main.hasOwnProperty("allow_kick_ban_members") 
                && this.props.widgetsettings.main["allow_kick_ban_members"] === false) {

                    editAccess = null;
                }
            }
        }

        this.mq.addListener(editAccess => this.setUserColumnTitle(editAccess));

        return (
            <React.Fragment>
                <CometChatBackdrop show={this.props.open} clicked={this.props.close} />
                <div css={modalWrapperStyle(this.props)} className="modal__viewmembers">
                    <span css={modalCloseStyle(clearIcon)} className="modal__close" onClick={this.props.close} title={Translator.translate("CLOSE", this.props.lang)}></span>
                    <div css={modalBodyStyle()} className="modal__body">
                        <div css={modalCaptionStyle(Translator.getDirection(this.props.lang))} className="modal__title">{Translator.translate("GROUP_MEMBERS", this.props.lang)}</div>
                        <div css={modalListStyle()} className="modal__content">
                            <div css={listHeaderStyle(this.props)} className="content__header">
                                <div css={nameColumnStyle(this.props, editAccess)} className="name">{this.state.userColumnTitle}</div>
                                <div css={scopeColumnStyle(this.props)} className="scope">{Translator.translate("SCOPE", this.props.lang)}</div>
                                {editAccess}
                            </div>
                            <div css={listStyle(this.props)} className="content__list" onScroll={this.handleScroll}>
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
    lang: Translator.getDefaultLanguage(),
    theme: theme,
    userColumnTitle: "",
};

CometChatViewGroupMemberList.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object,
    userColumnTitle: PropTypes.string
}

export default CometChatViewGroupMemberList;
