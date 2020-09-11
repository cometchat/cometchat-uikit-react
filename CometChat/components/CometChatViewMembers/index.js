import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { CometChat } from "@cometchat-pro/chat";

import MemberView from "../MemberView";
import Backdrop from '../Backdrop';

import GroupDetailContext from '../CometChatGroupDetail/context';

import {
    modalWrapperStyle,
    modalCloseStyle,
    modalBodyCtyle,
    modalTableStyle,
    tableCaptionStyle,
    tableBodyStyle,
    scopeColumnStyle,
    actionColumnStyle
} from "./style";

import clearIcon from "./resources/clear.svg";

class CometChatViewMembers extends React.Component {

    static contextType = GroupDetailContext;

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

    render() {

        const group = this.context;

        const membersList = [...group.memberlist];

        const groupMembers = membersList.map((member, key) => {
        
            return (<MemberView 
                theme={this.props.theme}
                key={key} 
                member={member}
                item={this.props.item}
                widgetsettings={this.props.widgetsettings}
                actionGenerated={this.updateMembers} />);
        });

        // const wrapperClassName = classNames({
        //     "modal__viewmembers": true,
        //     "modal--show": this.props.open
        // });

        let editAccess = null;
        if(this.props.item.scope !== CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {

            editAccess = (
                <React.Fragment>
                    <th css={actionColumnStyle()}>Ban</th>
                    <th css={actionColumnStyle()}>Kick</th>
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

        return (
            <React.Fragment>
                <Backdrop show={this.props.open} clicked={this.props.close} />
                <div css={modalWrapperStyle(this.props)}>
                    <span css={modalCloseStyle(clearIcon)} onClick={this.props.close} title="Close"></span>
                    <div css={modalBodyCtyle()}>
                        <table css={modalTableStyle(this.props)}>
                            <caption css={tableCaptionStyle()}>Group Members</caption>
                            <thead> 
                                <tr>
                                    <th>Name</th>
                                    <th css={scopeColumnStyle()}>Scope</th>
                                    {editAccess}
                                </tr>
                            </thead>
                            <tbody css={tableBodyStyle()} onScroll={this.handleScroll}>{groupMembers}</tbody>
                        </table>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default CometChatViewMembers;