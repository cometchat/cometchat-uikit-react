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
    actionColumnStyle
} from "./style";

import clearIcon from "./resources/clear.svg";

class CometChatBanMembers extends React.Component {

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

        const noRecordsFound = (
            <tr><td colSpan="3">No banned members found</td></tr>
        );
        
        return (
            <React.Fragment>
                <Backdrop show={this.props.open} clicked={this.props.close} />
                <div css={modalWrapperStyle(this.props)}>
                    <span css={modalCloseStyle(clearIcon)} onClick={this.props.close}></span>
                    <div css={modalBodyStyle()}>
                        <table css={modalTableStyle(this.props)}>
                            <caption css={tableCaptionStyle()}>Banned Members</caption>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th css={roleColumnStyle()}>Scope</th>
                                    <th css={actionColumnStyle()}>Unban</th>
                                </tr>
                            </thead>
                            <tbody css={tableBodyStyle()} onScroll={this.handleScroll}>{(bannedMembers.length) ? bannedMembers : noRecordsFound}</tbody>
                        </table>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default CometChatBanMembers;