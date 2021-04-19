import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { GroupDetailManager } from "./controller";

import { CometChatViewGroupMemberList, CometChatAddGroupMemberList, CometChatBanGroupMemberList } from "../../Groups";
import { CometChatSharedMediaView } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
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

    item;
    loggedInUser = null;
    static contextType = CometChatContext;

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

        CometChat.getLoggedinUser().then(user => this.loggedInUser = user).catch(error => {
            console.error(error);
        });
    }

    componentDidMount() {

        this.context.clearGroupMembers();

        this.item = this.context.item;

        const guid = this.context.item.guid;
        this.GroupDetailManager = new GroupDetailManager(guid);
        this.getGroupMembers();
        this.getBannedGroupMembers();
        this.GroupDetailManager.attachListeners(this.groupUpdated);
    }

    componentDidUpdate(prevProps, prevState) {

        if (this.item.guid !== this.context.item.guid) {

            this.context.clearGroupMembers();

            const guid = this.context.item.guid;
            this.GroupDetailManager.removeListeners();
            this.GroupDetailManager = new GroupDetailManager(guid);
            this.getGroupMembers();
            this.getBannedGroupMembers();
            this.GroupDetailManager.attachListeners(this.groupUpdated);
        }

        this.item = this.context.item;
    }

    componentWillUnmount() {

        this.GroupDetailManager.removeListeners();
        this.GroupDetailManager = null;
    }

    groupUpdated = (key, message, group, options) => {
        
        const guid = this.context.item.guid;
        if(guid !== group.guid) {
            return false;
        }
        
        switch(key) {
            case enums.USER_ONLINE:
            case enums.USER_OFFLINE: 
                this.updateGroupMemberPresence(options.user);
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

    /*
    Updating group members presence
    */
    updateGroupMemberPresence = (member) => {
        
        let memberlist = [...this.context.groupMembers];
        //search for user
        let memberKey = memberlist.findIndex((m, k) => m.uid === member.uid);
        //if found in the list, update user object
        if(memberKey > -1) {
    
            let memberObj =  memberlist[memberKey];
            let newMemberObj = Object.assign({}, memberObj, member);
            memberlist.splice(memberKey, 1, newMemberObj);

            //this.setState({ memberlist: memberlist });
            this.context.updateGroupMembers(memberlist);
        }


        let bannedmemberlist = [...this.context.bannedGroupMembers];
        //search for user
        let bannedMemberKey = bannedmemberlist.findIndex((m, k) => m.uid === member.uid);
        //if found in the list, update user object
        if(bannedMemberKey > -1) {
    
            let bannedMemberObj =  bannedmemberlist[bannedMemberKey];
            let newBannedMemberObj = Object.assign({}, bannedMemberObj, member);
            bannedmemberlist.splice(bannedMemberKey, 1, newBannedMemberObj);

            //this.setState({ bannedmemberlist: bannedmemberlist });
            this.updateBannedGroupMembers(bannedmemberlist);
        }
    }

    getGroupMembers = () => {

        const administratorslist = [], moderatorslist = []; 
        this.GroupDetailManager.fetchNextGroupMembers().then(groupMembers => {

            groupMembers.forEach(member => {

                if (member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
                    administratorslist.push(member);
                }
    
                if (member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR) {
                    moderatorslist.push(member);
                }
            });
            
            this.context.setAllGroupMembers(groupMembers, administratorslist, moderatorslist);

        }).catch(error => {

            const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
            this.context.setToastMessage("error", errorCode);
        });
    }

    getBannedGroupMembers = () => {

        if (this.context.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
            return false;
        }

        this.GroupDetailManager.fetchNextBannedGroupMembers().then(bannedMembers => {

            this.context.setBannedGroupMembers(bannedMembers);

        }).catch(error => {

            const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
            this.context.setToastMessage("error", errorCode);
        });
    }

    deleteGroup = () => {
        
        const guid = this.context.item.guid;
        CometChat.deleteGroup(guid).then(response => {

            if(response) {
                this.context.setToastMessage("success", "GROUP_DELETION_SUCCESS");
                this.context.setDeletedGroupId(guid);
            } else {
                this.context.setToastMessage("error", "GROUP_DELETION_FAIL");
            }

        }).catch(error => {

            const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
            this.context.setToastMessage("error", errorCode);
        });
    }

    leaveGroup = () => {

        const guid = this.context.item.guid;
        CometChat.leaveGroup(guid).then(response => {
            
            if (response) {
                this.context.setToastMessage("success", "GROUP_LEFT_SUCCESS");
                this.context.setLeftGroupId(guid);
            } else {
                this.context.setToastMessage("error", "GROUP_LEFT_FAIL");
            }
            
        }).catch(error => {

            const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
            this.context.setToastMessage("error", errorCode);
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
        
        switch (action) {
            case enums.ACTIONS["FETCH_GROUP_MEMBERS"]:
                this.getGroupMembers();
                break;
            case enums.ACTIONS["FETCH_BANNED_GROUP_MEMBERS"]:
                this.getBannedGroupMembers();
                break;
            case enums.ACTIONS["UNBAN_GROUP_MEMBER_SUCCESS"]:
                this.unbanMembers(members);
                break;
            case enums.ACTIONS["ADD_GROUP_MEMBER_SUCCESS"]:
                this.addParticipants(members);
                break;
            case enums.ACTIONS["BAN_GROUPMEMBER_SUCCESS"]:
            case enums.ACTIONS["KICK_GROUPMEMBER_SUCCESS"]:
                this.removeParticipants(members);
                break;
            case enums.ACTIONS["SCOPECHANGE_GROUPMEMBER_SUCCESS"]:
                this.updateParticipants(members);
                break;
            default:
                break;
        }
    }

    banMembers = (members) => {

        this.context.setBannedGroupMembers(members);
    }

    unbanMembers = (members) => {

        const bannedMembers = [...this.context.bannedGroupMembers];
        const unbannedMembers = [];

        const filteredBannedMembers = bannedMembers.filter(bannedmember => {

            const found = members.find(member => bannedmember.uid === member.uid);
            if(found) {
                unbannedMembers.push(found);
                return false;
            }
            return true;
        });

        this.props.actionGenerated(enums.ACTIONS["UNBAN_GROUP_MEMBER_SUCCESS"], unbannedMembers);
        this.context.updateBannedGroupMembers(filteredBannedMembers);
    }

    addParticipants = (members, triggerUpdate = true) => {
        
        this.context.setGroupMembers(members);

        this.props.actionGenerated(enums.ACTIONS["ADD_GROUP_MEMBER_SUCCESS"], members);
        if(triggerUpdate) {

            const newItem = { ...this.context.item, membersCount: this.context.groupMembers.length}
            this.context.setItem(newItem);
        }
    }

    removeParticipants = (member, triggerUpdate = true) => {
        
        const groupmembers = [...this.context.groupMembers];
        const filteredMembers = groupmembers.filter(groupmember => {

            if(groupmember.uid === member.uid) {
                return false;
            }
            return true;
        });

        this.context.updateGroupMembers(filteredMembers);

        if(triggerUpdate) {

            const newItem = { ...this.context.item, membersCount: filteredMembers.length }
            this.context.setItem(newItem);
        }
    }

    updateParticipants = (updatedMember) => {

        const memberlist = [...this.context.groupMembers];

        const memberKey = memberlist.findIndex(member => member.uid === updatedMember.uid);
        if(memberKey > -1) {

            const memberObj = memberlist[memberKey];
            const newMemberObj = Object.assign({}, memberObj, updatedMember, {"scope": updatedMember["scope"]});

            memberlist.splice(memberKey, 1, newMemberObj);
            this.props.actionGenerated(enums.ACTIONS["SCOPECHANGE_GROUPMEMBER_SUCCESS"], [newMemberObj]);
            this.context.updateGroupMembers(memberlist);
        }
    }

    render() {

        let viewMembersBtn = (
            <div css={contentItemStyle()} className="content__item">
                <div css={itemLinkStyle(this.props, 0)} className="item__link" onClick={() => this.clickHandler("viewmember", true)}>{Translator.translate("VIEW_MEMBERS", this.props.lang)}</div>                                           
            </div>
        );

        let addMembersBtn = null, deleteGroupBtn = null, bannedMembersBtn = null;
        if (this.context.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
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
        
        if (this.context.item.scope !== CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
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
                loggedinuser={this.loggedInUser}
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
                lang={this.props.lang}
                open={this.state.banMember} 
                close={() => this.clickHandler("banmember", false)}
                widgetsettings={this.props.widgetsettings}
                actionGenerated={this.membersActionHandler}  />
            );
        }

        return (
            <div css={detailStyle(this.props)} className="detailpane">
                <div css={headerStyle(this.props)} className="detailpane__header">
                        <div css={headerCloseStyle(navigateIcon, this.props)} className="header__close" onClick={() => this.props.actionGenerated(enums.ACTIONS["CLOSE_GROUP_DETAIL"])}></div>
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
