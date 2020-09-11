import React from 'react';

/** @jsx jsx */
import { jsx } from '@emotion/core';

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

import {
    detailStyle,
    headerStyle,
    headerCloseStyle,
    headerTitleStyle,
    detailPaneStyle,
    sectionStyle,
    sectionHeaderStyle,
    sectionContentStyle,
    contentItemStyle,
    itemLinkStyle
} from "./style";

import navigateIcon from "./resources/navigate_before.svg";

class CometChatGroupDetail extends React.Component {

    loggedInUser = null;

    constructor(props) {
        super(props);

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
                
                const updatedMember = Object.assign({}, member, { scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT });
                
                this.addParticipants([updatedMember], false);
            }
            break;
            case enums.GROUP_MEMBER_LEFT:
            case enums.GROUP_MEMBER_KICKED: {
                const member = options.user;
                this.removeParticipants(member, false);
            }
            break;
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

        let viewMembersBtn = (
            <div css={contentItemStyle()}>
                <div css={itemLinkStyle(this.props, 0)} onClick={() => this.clickHandler("viewmember", true)}>View Members</div>                                           
            </div>
        );

        let addMembersBtn = null, deleteGroupBtn = null, bannedMembersBtn = null;
        if(this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
            addMembersBtn = (
                <div css={contentItemStyle()}>
                    <div css={itemLinkStyle(this.props, 0)} onClick={() => this.clickHandler("addmember", true)}>Add Members</div>                                           
                </div>
            );

            deleteGroupBtn = (
                <div css={contentItemStyle()}>
                    <span css={itemLinkStyle(this.props, 1)} className="item__link link--delete" onClick={this.deleteGroup}>Delete and Exit</span>
                </div>
            );
        }
        
        if(this.props.item.scope !== CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
            bannedMembersBtn = (
                <div css={contentItemStyle()}>
                    <div css={itemLinkStyle(this.props, 0)} onClick={() => this.clickHandler("banmember", true)}>Banned Members</div>                                           
                </div>
            );
        }

        let leaveGroupBtn = (
            <div css={contentItemStyle()}>
                <span css={itemLinkStyle(this.props, 0)} onClick={this.leaveGroup}>Leave Group</span>
            </div>
        );

        let sharedmediaView = (
            <SharedMediaView theme={this.props.theme} containerHeight="225px" item={this.props.item} type={this.props.type} />
        );

        if(this.props.hasOwnProperty("widgetsettings") 
        && this.props.widgetsettings
        && this.props.widgetsettings.hasOwnProperty("main")) {

            //if view_group_members is disabled in chatwidget
            if(this.props.widgetsettings.main.hasOwnProperty("view_group_members")
            && this.props.widgetsettings.main["view_group_members"] === false
            && this.props.widgetsettings.main.hasOwnProperty("allow_kick_ban_members")
            && this.props.widgetsettings.main["allow_kick_ban_members"] === false
            && this.props.widgetsettings.main.hasOwnProperty("allow_promote_demote_members")
            && this.props.widgetsettings.main["allow_promote_demote_members"] === false) {
                viewMembersBtn = null;
            }

            //if add_group_members is disabled in chatwidget
            if(this.props.widgetsettings.main.hasOwnProperty("allow_add_members")
            && this.props.widgetsettings.main["allow_add_members"] === false) {
                addMembersBtn = null;
            }

            //if allow_kick_ban_members is disabled in chatwidget
            if(this.props.widgetsettings.main.hasOwnProperty("allow_kick_ban_members")
            && this.props.widgetsettings.main["allow_kick_ban_members"] === false) {
                bannedMembersBtn = null;
            }

            //if delete_group is disabled in chatwidget
            if(this.props.widgetsettings.main.hasOwnProperty("allow_delete_groups")
            && this.props.widgetsettings.main["allow_delete_groups"] === false) {
                deleteGroupBtn = null;
            }

            //if leave_group is disabled in chatwidgets
            if(this.props.widgetsettings.main.hasOwnProperty("join_or_leave_groups")
            && this.props.widgetsettings.main["join_or_leave_groups"] === false) {
                leaveGroupBtn = null;
            }

            //if view_shared_media is disabled in chatwidget
            if(this.props.widgetsettings.main.hasOwnProperty("view_shared_media")
            && this.props.widgetsettings.main["view_shared_media"] === false) {
                sharedmediaView = null;
            }
        }

        let members = (
            <div css={sectionStyle()}>
                <h6 css={sectionHeaderStyle(this.props)}>Members</h6>
                <div css={sectionContentStyle()}>
                    {viewMembersBtn}
                    {addMembersBtn}
                    {bannedMembersBtn}
                </div>
            </div>
        );

        let options = (
            <div css={sectionStyle()}>
                <h6 css={sectionHeaderStyle(this.props)}>Options</h6>
                <div css={sectionContentStyle()}>
                    {leaveGroupBtn}
                    {deleteGroupBtn}
                </div>
            </div>
        );

        if(viewMembersBtn === null && addMembersBtn === null && bannedMembersBtn === null) {
            members = null;
        }

        if(leaveGroupBtn === null && deleteGroupBtn === null) {
            options = null;
        }

        let viewMembers = null;
        if(this.state.viewMember) {
            viewMembers = (
                <CometChatViewMembers 
                theme={this.props.theme}
                item={this.props.item}
                open={this.state.viewMember}
                close={() => this.clickHandler("viewmember", false)}
                widgetsettings={this.props.widgetsettings}
                actionGenerated={this.membersActionHandler} />
            );
        }

        let addMembers = null;
        if(this.state.addMember) {
            addMembers = (
                <CometChatAddMembers 
                theme={this.props.theme}
                item={this.props.item}
                open={this.state.addMember} 
                close={() => this.clickHandler("addmember", false)}
                widgetsettings={this.props.widgetsettings}
                actionGenerated={this.membersActionHandler} />
            );
        }

        let bannedMembers = null;
        if(this.state.banMember) {
            bannedMembers = (
                <CometChatBanMembers
                theme={this.props.theme}
                item={this.props.item}
                open={this.state.banMember} 
                close={() => this.clickHandler("banmember", false)}
                widgetsettings={this.props.widgetsettings}
                actionGenerated={this.membersActionHandler}  />
            );
        }

        return (
            <div css={detailStyle(this.props)}>
                <GroupDetailContext.Provider 
                value={{
                    memberlist: this.state.memberlist,
                    bannedmemberlist: this.state.bannedmemberlist,
                    administratorslist: this.state.administratorslist,
                    moderatorslist: this.state.moderatorslist,
                    loggedinuser: this.loggedInUser,
                    item: this.props.item
                }}>
                    <div css={headerStyle(this.props)}>
                        <div css={headerCloseStyle(navigateIcon)} onClick={() => this.props.actionGenerated("closeDetailClicked")}></div>
                        <h4 css={headerTitleStyle()}>Details</h4>
                    </div>
                    <div css={detailPaneStyle()}>
                        {members}
                        {options}
                        {sharedmediaView}
                    </div>
                    {viewMembers}
                    {addMembers}
                    {bannedMembers}
                </GroupDetailContext.Provider>
            </div>
        );
    }
}

export default CometChatGroupDetail;