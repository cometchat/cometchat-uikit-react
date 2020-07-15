import React from 'react';

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";
import { SvgAvatar } from '../../util/svgavatar';

import * as enums from '../../util/enums.js';

import { GroupDetailManager } from "./controller";
import GroupDetailContext from './context';

import CometChatViewMembers from "../CometChatViewMembers";
import CometChatAddMembers from "../CometChatAddMembers";
import CometChatBanMembers from "../CometChatBanMembers";

import SharedMediaView from "../SharedMediaView";

import "./style.scss";

class CometChatGroupDetail extends React.Component {

    constructor() {
        super();

        this.state = {
            user: {},
            memberlist: [],
            bannedmemberlist: [],
            administratorslist: [],
            moderatorslist: [],
            viewMember: false,
            addMember: false,
            banMember: false,
            addAdministrator: false,
            addModerator: false
        }
    }

    componentDidMount() {

        this.setState({
            memberlist: [],
            administratorslist: [],
            moderatorslist: [],
            bannedmemberlist: []
        });

        const guid = this.props.item.guid;
        this.GroupDetailManager = new GroupDetailManager(guid);
        this.getGroupMembers();
        this.getBannedGroupMembers();
    }

    componentDidUpdate(prevProps, prevState) {

        if (prevProps.item.guid !== this.props.item.guid) {

            this.setState({
                memberlist: [],
                administratorslist: [],
                moderatorslist: [],
                bannedmemberlist: []
            });

            const guid = this.props.item.guid;
            this.GroupDetailManager = new GroupDetailManager(guid);
            this.getGroupMembers();
            this.getBannedGroupMembers();
        }

        if(prevProps.groupUpdated.messageId !== this.props.groupUpdated.messageId && this.props.groupUpdated.guid === this.props.item.guid) {

            const key = this.props.groupUpdated.action;
            switch(key) {
                case enums.GROUP_MEMBER_JOINED: {
                    const member = this.props.groupUpdated["message"]["sender"];
                    member["scope"] = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
                    this.setAvatar(member);
                    this.addParticipants([member]);
                }
                break;
                case enums.GROUP_MEMBER_LEFT: {
                    const member = this.props.groupUpdated["message"]["sender"];
                    this.removeParticipants(member);
                }
                break;
                case enums.GROUP_MEMBER_ADDED: {
                    const member = this.props.groupUpdated["message"]["actionOn"];
                    member["scope"] = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
                    this.setAvatar(member);
                    this.addParticipants([member]);
                }
                break;
                case enums.GROUP_MEMBER_KICKED: {
                    const member = this.props.groupUpdated["message"]["actionOn"];
                    this.removeParticipants(member);
                    if(member.uid === this.state.user.uid) {
                        this.props.actionGenerated("leftGroup", this.props.item);
                    }
                }
                break;
                case enums.GROUP_MEMBER_BANNED: {
                    const member = this.props.groupUpdated["message"]["actionOn"];
                    this.setAvatar(member);
                    this.banMembers([member]);
                    this.removeParticipants(member);
                    if(member.uid === this.state.user.uid) {
                        this.props.actionGenerated("leftGroup", this.props.item);
                    }
                }
                break;
                case enums.GROUP_MEMBER_UNBANNED: {
                    const member = this.props.groupUpdated["message"]["actionOn"];
                    this.unbanMembers([member]);
                }
                break;
                case enums.GROUP_MEMBER_SCOPE_CHANGED: {
                    const message = this.props.groupUpdated["message"];
                    const member = message["actionOn"];

                    const updatedMember = Object.assign({}, member, {scope: message["newScope"]});
                    this.updateParticipants(updatedMember);
                }
                break;
                default:
                break;
            }

        }
    }

    componentWillUnmount() {
        this.GroupDetailManager = null;
    }

    getGroupMembers = () => {

        const administratorslist = [], moderatorslist = []; 
        new CometChatManager().getLoggedInUser().then(user => {

            this.setState({user});
            this.GroupDetailManager.fetchNextGroupMembers().then(groupMembers => {

                groupMembers.forEach(member => {

                    this.setAvatar(member);

                    if(member.scope === "admin") {
                        administratorslist.push(member);
                    }
        
                    if(member.scope === "moderator") {
                        moderatorslist.push(member);
                    }
                });
                this.setState({ 
                    memberlist: [...this.state.memberlist, ...groupMembers], 
                    administratorslist: [...this.state.administratorslist, ...administratorslist], 
                    moderatorslist: [...this.state.moderatorslist, ...moderatorslist] 
                });

            }).catch(error => {
                console.error("[CometChatGroupDetail] getGroupMembers fetchNextGroupMembers error", error);
            });

        }).catch(error => {
            console.log("[CometChatGroupDetail] getGroupMembers getLoggedInUser error", error);
        });
    }

    getBannedGroupMembers = () => {

        if(this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
            return false;
        }

        new CometChatManager().getLoggedInUser().then(user => {

            this.GroupDetailManager.fetchNextBannedGroupMembers().then(bannedMembers => {

                bannedMembers.forEach(member => this.setAvatar(member));

                this.setState({ 
                    bannedmemberlist: [...this.state.bannedmemberlist, ...bannedMembers] 
                });

            }).catch(error => {
                console.error("[CometChatGroupDetail] getGroupMembers fetchNextGroupMembers error", error);
            });

        }).catch(error => {
            console.log("[CometChatGroupDetail] getGroupMembers getLoggedInUser error", error);
        });
    }
    
    setAvatar(member) {

        if(!member.getAvatar()) {
    
          const guid = member.getUid();
          const char = member.getName().charAt(0).toUpperCase();
          member.setAvatar(SvgAvatar.getAvatar(guid, char))
        }
    }

    deleteGroup = () => {

        const guid = this.props.item.guid;
        CometChat.deleteGroup(guid).then(response => {
            console.log("Groups deleted successfully:", response);
            this.props.actionGenerated("groupDeleted", this.props.item);
        }).catch(error => {
            console.log("Group delete failed with exception:", error);
        });
    }

    leaveGroup = () => {

        const guid = this.props.item.guid;
        CometChat.leaveGroup(guid).then(hasLeft => {
            console.log("Group left successfully:", hasLeft);
            this.props.actionGenerated("leftGroup", this.props.item);
        }).catch(error => {
            console.log("Group leaving failed with exception:", error);
        });
    }

    clickHandler = (action, flag) => {

        switch(action) {
            case "viewmember":
                this.setState({viewMember: flag});
            break;
            case "addmember":
                this.setState({addMember: flag});
            break;
            case "banmember":
                this.setState({banMember: flag});
            break;
            default:
            break;
        }
    }

    membersActionHandler = (action, members) => {

        switch(action) {
            case "banGroupMembers":
                this.banMembers(members);
                break;
            case "unbanGroupMembers":
                this.unbanMembers(members);
                break;
            case "addGroupParticipants":
                this.addParticipants(members);
                break;
            case "removeGroupParticipants":
                this.removeParticipants(members);
                break;
            case "updateGroupParticipants":
                this.updateParticipants(members);
                break;
            case "fetchGroupMembers":
                this.getGroupMembers();
                break;
            case "fetchBannedMembers":
                this.getBannedGroupMembers();
                break;
            default:
                break;

        }
    }

    banMembers = (members) => {
        this.setState({
            bannedmemberlist: [...this.state.bannedmemberlist, ...members],
        });
    }

    unbanMembers = (members) => {

        const bannedMembers = [...this.state.bannedmemberlist];
        const filteredBannedMembers = bannedMembers.filter(bannedmember => {

            const found = members.find(member => bannedmember.uid === member.uid);
            if(found) {
                return false;
            }
            return true;
        });

        this.setState({
            bannedmemberlist: [...filteredBannedMembers]
        });
    }

    addParticipants = (members) => {

        const memberlist = [...this.state.memberlist, ...members];
        this.setState({
            memberlist: memberlist,
        });

        this.props.actionGenerated("membersUpdated", this.props.item, memberlist.length);
    }

    removeParticipants = (member) => {

        const groupmembers = [...this.state.memberlist];
        const filteredMembers = groupmembers.filter(groupmember => {

            if(groupmember.uid === member.uid) {
                return false;
            }
            return true;
        });

        this.setState({
            memberlist: [...filteredMembers]
        });

        this.props.actionGenerated("membersUpdated", this.props.item, filteredMembers.length);
    }

    updateParticipants = (updatedMember) => {

        const memberlist = [...this.state.memberlist];

        let memberIndex = -1, memberFound = {};
        memberlist.forEach((member, index) => {

            if(member.uid === updatedMember.uid) {
                memberIndex = index;
                memberFound = Object.assign({}, member, updatedMember, {"scope": updatedMember["scope"]});
            }
        });

        const memberList = memberlist.splice(memberIndex, 1, memberFound);

        this.setState({
            memberlist: [...memberlist]
        });

        if(updatedMember.uid === this.state.user.uid) {
            this.props.actionGenerated("membersUpdated", updatedMember, memberlist.length);
        }
    }

    render() {

        let addMembersBtn = null, bannedMembersBtn = null, deleteGroupBtn = null;
        if(this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
            addMembersBtn = (
                <div className="chat-ppl-listitem add-member">
                    <div className="chat-ppl-listitem-dtls">
                        <span className="chat-ppl-listitem-name" onClick={() => this.clickHandler("addmember", true)}>Add Members</span>                                           
                    </div>
                </div>
            );

            deleteGroupBtn = (
                <div className="ccl-dtls-section-listitem">
                    <span className="ccl-dtls-section-listitem-link" onClick={this.deleteGroup}>Delete and Exit</span>
                </div>
            );
        }
        
        if(this.props.item.scope !== CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
            bannedMembersBtn = (
                <div className="chat-ppl-listitem add-member">
                    <div className="chat-ppl-listitem-dtls">
                        <span className="chat-ppl-listitem-name" onClick={() => this.clickHandler("banmember", true)}>Banned Members</span>                                           
                    </div>
                </div>
            );
        }

        let viewMembers = null;
        if(this.state.viewMember) {
            viewMembers = (
                <CometChatViewMembers 
                item={this.props.item}
                open={this.state.viewMember}
                close={() => this.clickHandler("viewmember", false)}
                actionGenerated={this.membersActionHandler} />
            );
        }

        let addMembers = null;
        if(this.state.addMember) {
            addMembers = (
                <CometChatAddMembers 
                item={this.props.item}
                open={this.state.addMember} 
                close={() => this.clickHandler("addmember", false)}
                actionGenerated={this.membersActionHandler} />
            );
        }

        let bannedMembers = null;
        if(this.state.banMember) {
            bannedMembers = (
                <CometChatBanMembers
                item={this.props.item}
                open={this.state.banMember} 
                close={() => this.clickHandler("banmember", false)}
                actionGenerated={this.membersActionHandler}  />
            );
        }

        return (
            <React.Fragment>
                <GroupDetailContext.Provider 
                value={{
                    memberlist: this.state.memberlist,
                    bannedmemberlist: this.state.bannedmemberlist,
                    administratorslist: this.state.administratorslist,
                    moderatorslist: this.state.moderatorslist,
                    loggedinuser: this.state.user,
                    item: this.props.item
                }}>
                    <div className="ccl-dtls-panel-wrap">
                        <div className="ccl-right-panel-head-wrap">
                            <div className="cc1-right-panel-close" onClick={() => this.props.actionGenerated("closeDetailClicked")}></div>
                            <h4 className="ccl-right-panel-head-ttl">Details</h4>
                        </div>
                        <div className="ccl-dtls-panel-body">
                            <div className="ccl-dtls-panel-section">
                                <h6 className="ccl-dtls-panel-section-head">Members</h6>
                                <div className="chat-ppl-list-wrap">
                                    {addMembersBtn}
                                    <div className="chat-ppl-listitem add-member">
                                        <div className="chat-ppl-listitem-dtls">
                                            <span className="chat-ppl-listitem-name" onClick={() => this.clickHandler("viewmember", true)}>View Members</span>                                           
                                        </div>
                                    </div>
                                    {bannedMembersBtn}
                                </div>
                            </div>
                            <div className="ccl-dtls-panel-section">
                                <h6 className="ccl-dtls-panel-section-head">Options</h6>
                                <div className="ccl-dtls-section-list">
                                    <div className="ccl-dtls-section-listitem"><span className="ccl-dtls-section-listitem-link" onClick={this.leaveGroup}>Leave Group</span></div>
                                    {deleteGroupBtn}
                                </div>
                            </div>
                            <div className="ccl-dtls-panel-section sharedmedia">
                                <SharedMediaView 
                                item={this.props.item}
                                type={this.props.type} />
                            </div>
                        </div>
                    </div>
                    {viewMembers}
                    {addMembers}
                    {bannedMembers}
                </GroupDetailContext.Provider>
            </React.Fragment>
        );
    }
}

export default CometChatGroupDetail;