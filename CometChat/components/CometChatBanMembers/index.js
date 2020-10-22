import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { CometChat } from "@cometchat-pro/chat";

import BanMemberView from "../BanMemberView";
import Backdrop from '../Backdrop';

import GroupDetailContext from '../CometChatGroupDetail/context';

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

import clearIcon from "./resources/clear.svg";

class CometChatBanMembers extends React.Component {

    decoratorMessage = "Loading...";
    static contextType = GroupDetailContext;

    constructor(props) {
        super(props);
        this.state = {
            membersToBan: [],
            membersToUnBan: []
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

            return (<BanMemberView 
                    theme={this.props.theme}
                    key={key} 
                    member={member}
                    item={this.props.item}
                    loggedinuser={group.loggedinuser}
                    widgetsettings={this.props.widgetsettings}
                    actionGenerated={this.updateMembers} />);

        });

        let messageContainer = null;
        if (bannedMembers.length === 0) {

            this.decoratorMessage = "No banned members found";
            messageContainer = (
                <caption css={contactMsgStyle()} className="bannedmembers__decorator-message">
                    <p css={contactMsgTxtStyle(this.props)} className="decorator-message">{this.decoratorMessage}</p>
                </caption>
            );
        }
        
        return (
            <React.Fragment>
                <Backdrop show={this.props.open} clicked={this.props.close} />
                <div css={modalWrapperStyle(this.props)} className="modal__addmembers">
                    <span css={modalCloseStyle(clearIcon)} className="modal__close" onClick={this.props.close}></span>
                    <div css={modalBodyStyle()} className="modal__body">
                        <table css={modalTableStyle(this.props)}>
                            <caption css={tableCaptionStyle()} className="modal__title">Banned Members</caption>
                            <thead>
                                <tr>
                                    <th className="name">Name</th>
                                    <th css={roleColumnStyle()} className="role">Scope</th>
                                    <th css={actionColumnStyle()} className="unban">Unban</th>
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

export default CometChatBanMembers;