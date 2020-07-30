import React from "react";
import classNames from "classnames";

import { CometChat } from "@cometchat-pro/chat";

import MemberView from "../MemberView";
import Backdrop from '../Backdrop';

import GroupDetailContext from '../CometChatGroupDetail/context';

import "./style.scss";

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
                console.log("Group member banning success with response", response);
                this.props.actionGenerated("removeGroupParticipants", memberToBan);
            }

        }).catch(error => {
            console.log("Group member banning failed with error", error);
        });
    }

    kickMember = (memberToKick) => {

        const guid = this.props.item.guid;
        CometChat.kickGroupMember(guid, memberToKick.uid).then(response => {
            
            if(response) {
                console.log("kickGroupMember response", response);
                this.props.actionGenerated("removeGroupParticipants", memberToKick);
            }
            
        }).catch(error => {
            console.log("Group member kicking failed with error", error);
        });
    }

    changeScope = (member, scope) => {

        const guid = this.props.item.guid;

        CometChat.updateGroupMemberScope(guid, member.uid, scope).then(response => {
            
            if(response) {
                console.log("Group member scope changed", response);
                const updatedMember = Object.assign({}, member, {scope: scope});
                this.props.actionGenerated("updateGroupParticipants", updatedMember);
            }
            
        }).catch(error => {
            console.log("Group member scopped changed failed", error);
        });
    }

    render() {

        const group = this.context;

        const membersList = [...group.memberlist];

        const groupMembers = membersList.map((member, key) => {
        
            return (<MemberView 
                key={key} 
                member={member}
                item={this.props.item}
                actionGenerated={this.updateMembers} />);
        });

        const wrapperClassName = classNames({
            "popup-box": true,
            "view-member-popup": true,
            "show": this.props.open
        });

        let editAccess = null;
        if(this.props.item.scope !== CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
            editAccess = (
                <React.Fragment>
                    <th scope="col">Change Scope</th>
                    <th scope="col">Ban</th>
                    <th scope="col">Kick</th>
                </React.Fragment>
            );
        }

        return (
            <React.Fragment>
                <Backdrop show={this.props.open} clicked={this.props.close} />
                <div className={wrapperClassName}>
                    <span className="popup-close" onClick={this.props.close} title="Close"></span>
                    <div className="popup-body">
                        <table>
                            <caption>Group Members</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">Scope</th>
                                    {editAccess}
                                </tr>
                            </thead>
                            <tbody onScroll={this.handleScroll}>{groupMembers}</tbody>
                        </table>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default CometChatViewMembers;