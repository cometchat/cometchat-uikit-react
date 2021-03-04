import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { GroupDetailManager } from "./controller";

import { CometChatViewGroupMemberList, CometChatAddGroupMemberList, CometChatBanGroupMemberList } from "../../Groups";
import { CometChatSharedMediaView } from "../../Shared";
import GroupDetailContext from "./context";

import * as enums from "../../../util/enums.js";
import { validateWidgetSettings } from "../../../util/common";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

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

import navigateIcon from "./resources/navigate.png";

class CometChatGroupDetails extends React.Component {

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
                //this.setAvatar(member);
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
        CometChat.getLoggedinUser().then(user => {

            this.loggedInUser = user;
            this.GroupDetailManager.fetchNextGroupMembers().then(groupMembers => {

                groupMembers.forEach(member => {

                    if (member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
                        administratorslist.push(member);
                    }
        
                    if (member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR) {
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
            console.log("[CometChatGroupDetail] getGroupMembers getLoggedinUser error", error);
        });
    }

    getBannedGroupMembers = () => {

        if(this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
            return false;
        }

        CometChat.getLoggedinUser().then(user => {

            this.GroupDetailManager.fetchNextBannedGroupMembers().then(bannedMembers => {

                this.setState({ 
                    bannedmemberlist: [...this.state.bannedmemberlist, ...bannedMembers] 
                });

            }).catch(error => {
                console.error("[CometChatGroupDetail] getGroupMembers fetchNextGroupMembers error", error);
            });

        }).catch(error => {
            console.log("[CometChatGroupDetail] getGroupMembers getLoggedinUser error", error);
        });
    }

    deleteGroup = () => {

        const guid = this.props.item.guid;
        CometChat.deleteGroup(guid).then(response => {
            console.log("Groups deleted successfully:", response);
            this.props.actionGenerated(enums.ACTIONS["GROUP_DELETED"], this.props.item);
        }).catch(error => {
            console.log("Group delete failed with exception:", error);
        });
    }

    leaveGroup = () => {

        const guid = this.props.item.guid;
        CometChat.leaveGroup(guid).then(hasLeft => {
            
            console.log("Group left successfully:", hasLeft);
            this.props.actionGenerated(enums.ACTIONS["GROUP_LEFT"], this.props.item);
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
        const unbannedMembers = [];

        const filteredBannedMembers = bannedMembers.filter(bannedmember => {

            const found = members.find(member => bannedmember.uid === member.uid);
            if(found) {
                unbannedMembers.push(found);
                return false;
            }
            return true;
        });

        this.props.actionGenerated("memberUnbanned", unbannedMembers);

        this.setState({
            bannedmemberlist: [...filteredBannedMembers]
        });
    }

    addParticipants = (members, triggerUpdate = true) => {
        
        const memberlist = [...this.state.memberlist, ...members];

        this.setState({
            memberlist: memberlist,
        });

        this.props.actionGenerated("membersAdded", members);
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

            this.props.actionGenerated("memberScopeChanged", [newMemberObj]);
            this.setState({memberlist: memberlist});
        }
    }

    render() {

        let viewMembersBtn = (
            <div css={contentItemStyle()} className="content__item">
                <div css={itemLinkStyle(this.props, 0)} className="item__link" onClick={() => this.clickHandler("viewmember", true)}>{Translator.translate("VIEW_MEMBERS", this.props.lang)}</div>                                           
            </div>
        );

        let addMembersBtn = null, deleteGroupBtn = null, bannedMembersBtn = null;
        if(this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
            addMembersBtn = (
                <div css={contentItemStyle()} className="content__item">
                    <div css={itemLinkStyle(this.props, 0)} className="item__link" onClick={() => this.clickHandler("addmember", true)}>{Translator.translate("ADD_MEMBERS", this.props.lang)}</div>                                           
                </div>
            );

            deleteGroupBtn = (
                <div css={contentItemStyle()} className="content__item">
                    <span css={itemLinkStyle(this.props, 1)} className="item__link" onClick={this.deleteGroup}>{Translator.translate("DELETE_AND_EXIT", this.props.lang)}</span>
                </div>
            );
        }
        
        if(this.props.item.scope !== CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
            bannedMembersBtn = (
                <div css={contentItemStyle()} className="content__item">
                    <div css={itemLinkStyle(this.props, 0)} className="item__link" onClick={() => this.clickHandler("banmember", true)}>{Translator.translate("BANNED_MEMBERS", this.props.lang)}</div>                                           
                </div>
            );
        }

        let leaveGroupBtn = (
            <div css={contentItemStyle()} className="content__item">
                <span css={itemLinkStyle(this.props, 0)} className="item__link" onClick={this.leaveGroup}>{Translator.translate("LEAVE_GROUP", this.props.lang)}</span>
            </div>
        );

        let sharedmediaView = (
            <CometChatSharedMediaView 
            theme={this.props.theme} 
            item={this.props.item} 
            type={this.props.type} 
            lang={this.props.lang}
            containerHeight="225px" 
            widgetsettings={this.props.widgetsettings} />
        );

        //if viewing, kicking/banning, promoting/demoting group membersare disabled in chatwidget
        if (validateWidgetSettings(this.props.widgetsettings, "view_group_members") === false
        && validateWidgetSettings(this.props.widgetsettings, "allow_kick_ban_members") === false
        && validateWidgetSettings(this.props.widgetsettings, "allow_promote_demote_members") === false) {
            viewMembersBtn = null;
        }

        //if adding group members is disabled in chatwidget
        if (validateWidgetSettings(this.props.widgetsettings, "allow_add_members") === false) {
            addMembersBtn = null;
        }

        //if kicking/banning/unbanning group members is disabled in chatwidget
        if (validateWidgetSettings(this.props.widgetsettings, "allow_kick_ban_members") === false) {
            bannedMembersBtn = null;
        }

        //if deleting group is disabled in chatwidget
        if (validateWidgetSettings(this.props.widgetsettings, "allow_delete_groups") === false) {
            deleteGroupBtn = null;
        }

        //if leaving group is disabled in chatwidget
        if (validateWidgetSettings(this.props.widgetsettings, "join_or_leave_groups") === false) {
            leaveGroupBtn = null;
        }

        //if viewing shared media group is disabled in chatwidget
        if (validateWidgetSettings(this.props.widgetsettings, "view_shared_media") === false) {
            sharedmediaView = null;
        }

        let members = (
            <div css={sectionStyle()} className="section section__members">
                <h6 css={sectionHeaderStyle(this.props)} className="section__header">{Translator.translate("MEMBERS", this.props.lang)}</h6>
                <div css={sectionContentStyle()} className="section__content">
                    {viewMembersBtn}
                    {addMembersBtn}
                    {bannedMembersBtn}
                </div>
            </div>
        );

        let options = (
            <div css={sectionStyle()} className="section section__options">
                <h6 css={sectionHeaderStyle(this.props)} className="section__header">{Translator.translate("OPTIONS", this.props.lang)}</h6>
                <div css={sectionContentStyle()} className="section__content">
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
                <CometChatViewGroupMemberList 
                theme={this.props.theme}
                item={this.props.item}
                lang={this.props.lang}
                open={this.state.viewMember}
                close={() => this.clickHandler("viewmember", false)}
                widgetsettings={this.props.widgetsettings}
                actionGenerated={this.membersActionHandler} />
            );
        }

        let addMembers = null;
        if(this.state.addMember) {
            addMembers = (
                <CometChatAddGroupMemberList 
                theme={this.props.theme}
                item={this.props.item}
                lang={this.props.lang}
                open={this.state.addMember} 
                close={() => this.clickHandler("addmember", false)}
                widgetsettings={this.props.widgetsettings}
                actionGenerated={this.membersActionHandler} />
            );
        }

        let bannedMembers = null;
        if(this.state.banMember) {
            bannedMembers = (
                <CometChatBanGroupMemberList
                theme={this.props.theme}
                item={this.props.item}
                lang={this.props.lang}
                open={this.state.banMember} 
                close={() => this.clickHandler("banmember", false)}
                widgetsettings={this.props.widgetsettings}
                actionGenerated={this.membersActionHandler}  />
            );
        }

        return (
            <div css={detailStyle(this.props)} className="detailpane">
                <GroupDetailContext.Provider 
                value={{
                memberlist: this.state.memberlist,
                bannedmemberlist: this.state.bannedmemberlist,
                administratorslist: this.state.administratorslist,
                moderatorslist: this.state.moderatorslist,
                loggedinuser: this.loggedInUser,
                item: this.props.item
                }}>
                <div css={headerStyle(this.props)} className="detailpane__header">
                    <div css={headerCloseStyle(navigateIcon, this.props)} className="header__close" onClick={() => this.props.actionGenerated("closeDetailClicked")}></div>
                    <h4 css={headerTitleStyle()} className="header__title">{Translator.translate("DETAILS", this.props.lang)}</h4>
                </div>
                <div css={detailPaneStyle()} className="detailpane__section">
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

// Specifies the default values for props:
CometChatGroupDetails.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme
};

CometChatGroupDetails.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object
}

export default CometChatGroupDetails;
