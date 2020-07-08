import React from "react";
import classNames from "classnames";

import { CometChat } from "@cometchat-pro/chat";

import BanMemberView from "../BanMemberView";
import Backdrop from '../Backdrop';

import GroupDetailContext from '../CometChatGroupDetail/context';

import "./style.scss";

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
                    key={key} 
                    member={member}
                    item={this.props.item}
                    loggedinuser={group.loggedinuser}
                    actionGenerated={this.updateMembers} />);

        });

        const noRecordsFound = (
            <tr><td colSpan="3">No banned members found</td></tr>
        );

        const wrapperClassName = classNames({
            "popup-box": true,
            "ban-member-popup": true,
            "show": this.props.open
        });
        
        return (
            <React.Fragment>
                <Backdrop show={this.props.open} clicked={this.props.close} />
                <div className={wrapperClassName}>
                    <span className="popup-close" onClick={this.props.close}></span>
                    <div className="popup-body">
                        <table>
                            <caption>Banned Members</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">Scope</th>
                                    <th scope="col">Unban</th>
                                </tr>
                            </thead>
                            <tbody onScroll={this.handleScroll}>{(bannedMembers.length) ? bannedMembers : noRecordsFound}</tbody>
                        </table>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default CometChatBanMembers;