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

    loggedInUser = null;

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
        this.GroupDetailManager.attachListeners(this.groupUpdated);
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
            this.GroupDetailManager.removeListeners();
            this.GroupDetailManager = new GroupDetailManager(guid);
            this.getGroupMembers();
            this.getBannedGroupMembers();
            this.GroupDetailManager.attachListeners(this.groupUpdated);
        }
    }

    componentWillUnmount() {

        this.GroupDetailManager.removeListeners();
        this.GroupDetailManager = null;
    }

    groupUpdated = (key, message, group, options) => {
        
        const guid = this.props.item.guid;
        if(guid !== group.guid) {
            return false;
        }
        
        switch(key) {
            case enums.USER_ONLINE:
            case enums.USER_OFFLINE: 
                this.groupMemberUpdated(options.user);
            break;
            case enums.GROUP_MEMBER_ADDED:
            case enums.GROUP_MEMBER_JOINED: {
                const member = options.user;
                this.setAvatar(member);
                this.addParticipants([member], false);
            }
            break;
            case enums.GROUP_MEMBER_LEFT: {
                const member = options.user;
                this.removeParticipants(member, false);
            }
            break;
            case enums.GROUP_MEMBER_KICKED: {
                this.removeParticipants(options.user, false);
                break;
            }
            case enums.GROUP_MEMBER_BANNED: {
                const member = options.user;
                this.setAvatar(member);
                this.banMembers([member]);
                this.removeParticipants(member, false);
            }
            break;
            case enums.GROUP_MEMBER_UNBANNED: {
                const member = options.user;
                this.unbanMembers([member]);
            }
            break;
            case enums.GROUP_MEMBER_SCOPE_CHANGED: {
                const member = options.user;

                const updatedMember = Object.assign({}, member, {scope: options["scope"]});
                this.updateParticipants(updatedMember);
            }
            break;
            default:
            break;
        }
    }

    groupMemberUpdated = (member) => {
        
        let memberlist = [...this.state.memberlist];
        //search for user
        let memberKey = memberlist.findIndex((m, k) => m.uid === member.uid);
        //if found in the list, update user object
        if(memberKey > -1) {
    
          let memberObj =  memberlist[memberKey];
          let newMemberObj = Object.assign({}, memberObj, member);
          memberlist.splice(memberKey, 1, newMemberObj);
    
          this.setState({ memberlist: memberlist });
        }


        let bannedmemberlist = [...this.state.bannedmemberlist];
        //search for user
        let bannedMemberKey = bannedmemberlist.findIndex((m, k) => m.uid === member.uid);
        //if found in the list, update user object
        if(bannedMemberKey > -1) {
    
          let bannedMemberObj =  bannedmemberlist[bannedMemberKey];
          let newBannedMemberObj = Object.assign({}, bannedMemberObj, member);
          bannedmemberlist.splice(bannedMemberKey, 1, newBannedMemberObj);
    
          this.setState({ bannedmemberlist: bannedmemberlist });
        }
    }

    getGroupMembers = () => {

        const administratorslist = [], moderatorslist = []; 
        new CometChatManager().getLoggedInUser().then(user => {

            this.loggedInUser = user;
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

        if(!member.avatar) {
    
          const uid = member.uid;
          const char = member.name.charAt(0).toUpperCase();

          member.avatar = (SvgAvatar.getAvatar(uid, char));
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
        console.log("membersActionHandler", action);
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

    addParticipants = (members, triggerUpdate = true) => {

        const memberlist = [...this.state.memberlist, ...members];
        this.setState({
            memberlist: memberlist,
        });

        if(triggerUpdate) {
            this.props.actionGenerated("membersUpdated", this.props.item, memberlist.length);
        }
    }

    removeParticipants = (member, triggerUpdate = true) => {

        const groupmembers = [...this.state.memberlist];
        const filteredMembers = groupmembers.filter(groupmember => {

            if(groupmember.uid === member.uid) {
                return false;
            }
            return true;
        });

        this.setState({memberlist: filteredMembers});

        if(triggerUpdate) {
            this.props.actionGenerated("membersUpdated", this.props.item, filteredMembers.length);
        }
    }

    updateParticipants = (updatedMember) => {

        const memberlist = [...this.state.memberlist];

        const memberKey = memberlist.findIndex(member => member.uid === updatedMember.uid);
        if(memberKey > -1) {

            const memberObj = memberlist[memberKey];
            const newMemberObj = Object.assign({}, memberObj, updatedMember, {"scope": updatedMember["scope"]});

            memberlist.splice(memberKey, 1, newMemberObj);

            this.setState({memberlist: memberlist});
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
                    loggedinuser: this.loggedInUser,
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