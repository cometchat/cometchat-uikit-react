import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { GroupDetailManager } from "./controller";

import { CometChatConfirmDialog, CometChatToastNotification } from "../../Shared";
import { 
	CometChatViewGroupMemberList, 
	CometChatAddGroupMemberList, 
	CometChatBanGroupMemberList, 
	CometChatTransferOwnershipMemberList
} from "../../Groups";

import { CometChatSharedMediaView } from "../../Shared/CometChatSharedMediaView/index.js";

import { CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";

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

import navigateIcon from "./resources/back.svg";

class CometChatGroupDetails extends React.Component {
	item;
	static contextType = CometChatContext;

	constructor(props, context) {
		super(props, context);

		this._isMounted = false;

		this.state = {
			loggedInUser: null,
			memberlist: [],
			bannedmemberlist: [],
			administratorslist: [],
			moderatorslist: [],
			viewMember: false,
			addMember: false,
			banMember: false,
			addAdministrator: false,
			addModerator: false,
			enableAddGroupMembers: false,
			enableChangeScope: false,
			enableKickGroupMembers: false,
			enableBanGroupMembers: false,
			enableDeleteGroup: false,
			enableViewGroupMembers: false,
			enableLeaveGroup: false,
			enableSharedMedia: false,
			showDeleteConfirmDialog: false,
			showLeaveGroupConfirmDialog: false,
			showTransferOwnershipConfirmDialog: false,
			transferOwnership: false,
		};

		this.toastRef = React.createRef();
	}

	componentDidMount() {
		CometChat.getLoggedinUser()
			.then(user => {
				if (this._isMounted) {
					this.setState({ loggedInUser: user });
				}
			})
			.catch(error => this.toastRef.setError("SOMETHING_WRONG"));

		this._isMounted = true;
		this.context.clearGroupMembers();

		this.item = this.context.item;

		const guid = this.context.item.guid;
		this.GroupDetailManager = new GroupDetailManager(guid);
		this.getGroupMembers();
		this.getBannedGroupMembers();
		this.GroupDetailManager.attachListeners(this.groupUpdated);

		this.enableAddGroupMembers();
		this.enableChangeScope();
		this.enableKickGroupMembers();
		this.enableBanGroupMembers();
		this.enableViewGroupMembers();
		this.enableDeleteGroup();
		this.enableLeaveGroup();
		this.enableSharedMedia();
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
		this.enableAddGroupMembers();
		this.enableChangeScope();
		this.enableKickGroupMembers();
		this.enableBanGroupMembers();
		this.enableViewGroupMembers();
		this.enableDeleteGroup();
		this.enableLeaveGroup();
		this.enableSharedMedia();
	}

	componentWillUnmount() {
		this.GroupDetailManager.removeListeners();
		this.GroupDetailManager = null;
		this._isMounted = false;
	}

	enableAddGroupMembers = () => {
		this.context.FeatureRestriction.isAddingGroupMembersEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableAddGroupMembers && this._isMounted) {
					this.setState({ enableAddGroupMembers: response });
				}
			})
			.catch(error => {
				if (this.state.enableAddGroupMembers !== false && this._isMounted) {
					this.setState({ enableAddGroupMembers: false });
				}
			});
	};

	enableChangeScope = () => {
		this.context.FeatureRestriction.isChangingGroupMemberScopeEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableChangeScope && this._isMounted) {
					this.setState({ enableChangeScope: response });
				}
			})
			.catch(error => {
				if (this.state.enableChangeScope !== false && this._isMounted) {
					this.setState({ enableChangeScope: false });
				}
			});
	};

	enableKickGroupMembers = () => {
		this.context.FeatureRestriction.isKickingGroupMembersEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableKickGroupMembers && this._isMounted) {
					this.setState({ enableKickGroupMembers: response });
				}
			})
			.catch(error => {
				if (this.state.enableKickGroupMembers !== false && this._isMounted) {
					this.setState({ enableKickGroupMembers: false });
				}
			});
	};

	enableBanGroupMembers = () => {
		this.context.FeatureRestriction.isBanningGroupMembersEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableBanGroupMembers && this._isMounted) {
					this.setState({ enableBanGroupMembers: response });
				}
			})
			.catch(error => {
				if (this.state.enableBanGroupMembers !== false && this._isMounted) {
					this.setState({ enableBanGroupMembers: false });
				}
			});
	};

	enableDeleteGroup = () => {
		this.context.FeatureRestriction.isGroupDeletionEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableDeleteGroup && this._isMounted) {
					this.setState({ enableDeleteGroup: response });
				}
			})
			.catch(error => {
				if (this.state.enableDeleteGroup !== false && this._isMounted) {
					this.setState({ enableDeleteGroup: false });
				}
			});
	};

	enableViewGroupMembers = () => {
		this.context.FeatureRestriction.isViewingGroupMembersEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableViewGroupMembers && this._isMounted) {
					this.setState({ enableViewGroupMembers: response });
				}
			})
			.catch(error => {
				if (this.state.enableViewGroupMembers !== false && this._isMounted) {
					this.setState({ enableViewGroupMembers: false });
				}
			});
	};

	enableLeaveGroup = () => {
		this.context.FeatureRestriction.isJoinLeaveGroupsEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableLeaveGroup && this._isMounted) {
					this.setState({ enableLeaveGroup: response });
				}
			})
			.catch(error => {
				if (this.state.enableLeaveGroup !== false && this._isMounted) {
					this.setState({ enableLeaveGroup: false });
				}
			});
	};

	enableSharedMedia = () => {
		this.context.FeatureRestriction.isSharedMediaEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableSharedMedia && this._isMounted) {
					this.setState({ enableSharedMedia: response });
				}
			})
			.catch(error => {
				if (this.state.enableSharedMedia !== false && this._isMounted) {
					this.setState({ enableSharedMedia: false });
				}
			});
	};

	enableBlockUser = () => {
		this.context.FeatureRestriction.isBlockUserEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableBlockUser && this._isMounted) {
					this.setState({ enableBlockUser: response });
				}
			})
			.catch(error => {
				if (this.state.enableBlockUser !== false && this._isMounted) {
					this.setState({ enableBlockUser: false });
				}
			});
	};

	groupUpdated = (key, message, group, options) => {
		const guid = this.context.item.guid;
		if (guid !== group.guid) {
			return false;
		}

		switch (key) {
			case enums.USER_ONLINE:
			case enums.USER_OFFLINE:
				this.updateGroupMemberPresence(options.user);
				break;
			case enums.GROUP_MEMBER_ADDED:
			case enums.GROUP_MEMBER_JOINED:
				{
					const member = options.user;
					const updatedMember = Object.assign({}, member, { scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT });

					this.addParticipants([updatedMember], false);
				}
				break;
			case enums.GROUP_MEMBER_LEFT:
			case enums.GROUP_MEMBER_KICKED:
				{
					const member = options.user;
					this.removeParticipants(key, member, false);
				}
				break;
			case enums.GROUP_MEMBER_BANNED:
				{
					const member = options.user;
					//this.setAvatar(member);
					this.banMembers([member]);
					this.removeParticipants(key, member, false);
				}
				break;
			case enums.GROUP_MEMBER_UNBANNED:
				{
					const member = options.user;
					this.unbanMembers([member]);
				}
				break;
			case enums.GROUP_MEMBER_SCOPE_CHANGED:
				{
					const member = options.user;
					const updatedMember = Object.assign({}, member, { scope: options["scope"] });
					this.updateParticipants(updatedMember);
				}
				break;
			default:
				break;
		}
	};

	/*
    Updating group members presence
    */
	updateGroupMemberPresence = member => {
		let memberlist = [...this.context.groupMembers];
		//search for user
		let memberKey = memberlist.findIndex((m, k) => m.uid === member.uid);
		//if found in the list, update user object
		if (memberKey > -1) {
			let memberObj = memberlist[memberKey];
			let newMemberObj = Object.assign({}, memberObj, member);
			memberlist.splice(memberKey, 1, newMemberObj);

			this.context.updateGroupMembers(memberlist);
		}

		let bannedmemberlist = [...this.context.bannedGroupMembers];
		//search for user
		let bannedMemberKey = bannedmemberlist.findIndex((m, k) => m.uid === member.uid);
		//if found in the list, update user object
		if (bannedMemberKey > -1) {
			let bannedMemberObj = bannedmemberlist[bannedMemberKey];
			let newBannedMemberObj = Object.assign({}, bannedMemberObj, member);
			bannedmemberlist.splice(bannedMemberKey, 1, newBannedMemberObj);

			this.updateBannedGroupMembers(bannedmemberlist);
		}
	};

	getGroupMembers = () => {
		const administratorslist = [],
			moderatorslist = [];
		this.GroupDetailManager.fetchNextGroupMembers()
			.then(groupMembers => {
				groupMembers.forEach(member => {
					if (member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
						administratorslist.push(member);
					}

					if (member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR) {
						moderatorslist.push(member);
					}
				});

				this.context.setAllGroupMembers(groupMembers, administratorslist, moderatorslist);
			})
			.catch(error => this.toastRef.setError("SOMETHING_WRONG"));
	};

	getBannedGroupMembers = () => {
		if (this.context.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
			return false;
		}

		this.GroupDetailManager.fetchNextBannedGroupMembers()
			.then(bannedMembers => {
				this.context.setBannedGroupMembers(bannedMembers);
			})
			.catch(error => this.toastRef.setError("SOMETHING_WRONG"));
	};

	deleteGroup = () => {
		this.setState({ showDeleteConfirmDialog: true, showLeaveGroupConfirmDialog: false, showTransferOwnershipConfirmDialog: false });
	};

	onDeleteConfirm = e => {
		const optionSelected = e.target.value;
		this.setState({ showDeleteConfirmDialog: false });

		if (optionSelected === "no") {
			return false;
		}

		const guid = this.context.item.guid;
		CometChat.deleteGroup(guid)
			.then(response => {
				if (response) {
					this.context.setToastMessage("success", "GROUP_DELETION_SUCCESS");
					this.context.setDeletedGroupId(guid);
				} else {
					this.toastRef.setError("SOMETHING_WRONG");
				}
			})
			.catch(error => this.toastRef.setError("SOMETHING_WRONG"));
	};

	onLeaveConfirm = e => {
		const optionSelected = e.target.value;
		this.setState({ showLeaveGroupConfirmDialog: false });

		if (optionSelected === "no") {
			return false;
		}

		const guid = this.context.item.guid;
		CometChat.leaveGroup(guid)
			.then(response => {
				if (response) {
					this.context.setLeftGroupId(guid);
				} else {
					this.toastRef.setError("SOMETHING_WRONG");
				}
			})
			.catch(error => this.toastRef.setError("SOMETHING_WRONG"));
	};

	onTransferConfirm = e => {
		const optionSelected = e.target.value;
		this.setState({ showTransferOwnershipConfirmDialog: false });
		if (optionSelected === "no") {
			return false;
		}

		this.setState({ transferOwnership: true });
	};

	leaveGroup = () => {
		/**
		 * If loggeduser is the owner of the group; ask him to transfer ownership before leaving the group else show leave group confirmtion dialog
		 */
		if (this.context.item?.owner === this.state.loggedInUser?.uid) {
			this.setState({ showTransferOwnershipConfirmDialog: true, showDeleteConfirmDialog: false, showLeaveGroupConfirmDialog: false });
		} else {
			this.setState({ showLeaveGroupConfirmDialog: true, showTransferOwnershipConfirmDialog: false, showDeleteConfirmDialog: false });
		}
	};

	clickHandler = (action, flag) => {
		switch (action) {
			case "viewmember":
				this.setState({ viewMember: flag });
				break;
			case "addmember":
				this.setState({ addMember: flag });
				break;
			case "banmember":
				this.setState({ banMember: flag });
				break;
			case "transferownership":
				this.setState({ transferOwnership: flag });
				break;
			default:
				break;
		}
	};

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
				this.removeParticipants(action, members);
				break;
			case enums.ACTIONS["SCOPECHANGE_GROUPMEMBER_SUCCESS"]:
				this.updateParticipants(members);
				break;
			case enums.ACTIONS["OWNERSHIP_TRANSFERRED"]:
				this.updateOwnership(members);
				break;
			default:
				break;
		}
	};

	banMembers = members => {
		this.context.setBannedGroupMembers(members);
	};

	unbanMembers = members => {
		const bannedMembers = [...this.context.bannedGroupMembers];
		const unbannedMembers = [];

		const filteredBannedMembers = bannedMembers.filter(bannedmember => {
			const found = members.find(member => bannedmember.uid === member.uid);
			if (found) {
				unbannedMembers.push(found);
				return false;
			}
			return true;
		});

		this.props.actionGenerated(enums.ACTIONS["UNBAN_GROUP_MEMBER_SUCCESS"], unbannedMembers);
		this.context.updateBannedGroupMembers(filteredBannedMembers);
	};

	addParticipants = (members, triggerUpdate = true) => {
		this.context.setGroupMembers(members);
		
		if (triggerUpdate) {
			const newItem = { ...this.context.item, membersCount: this.context.groupMembers.length };
			this.context.setItem(newItem);

			this.props.actionGenerated(enums.ACTIONS["ADD_GROUP_MEMBER_SUCCESS"], members);
		}
	};

	removeParticipants = (action, member, triggerUpdate = true) => {

		const groupmembers = [...this.context.groupMembers];
		const filteredMembers = groupmembers.filter(groupmember => {
			if (groupmember.uid === member.uid) {
				return false;
			}
			return true;
		});

		this.context.updateGroupMembers(filteredMembers);

		if (triggerUpdate) {
			
			const newItem = { ...this.context.item, membersCount: filteredMembers.length };
			this.context.setItem(newItem);

			//if group member is banned, update banned member list in context api
			if(action === enums.ACTIONS["BAN_GROUPMEMBER_SUCCESS"]) {
				this.context.setBannedGroupMembers([member]);
			}

			this.props.actionGenerated(action, [member]);
		}
	};

	updateParticipants = updatedMember => {
		const memberlist = [...this.context.groupMembers];

		const memberKey = memberlist.findIndex(member => member.uid === updatedMember.uid);
		if (memberKey > -1) {
			const memberObj = memberlist[memberKey];
			const newMemberObj = Object.assign({}, memberObj, updatedMember, { scope: updatedMember["scope"] });

			memberlist.splice(memberKey, 1, newMemberObj);
			this.props.actionGenerated(enums.ACTIONS["SCOPECHANGE_GROUPMEMBER_SUCCESS"], [newMemberObj]);
			this.context.updateGroupMembers(memberlist);
		}
	};

	updateOwnership = uid => {
		const item = { ...this.context.item, owner: uid };
		const type = CometChat.RECEIVER_TYPE.GROUP;

		this.setState({ transferOwnership: false });
		this.context.setTypeAndItem(type, item);
	};

	closeGroupDetail = () => {
		this.props.actionGenerated(enums.ACTIONS["CLOSE_GROUP_DETAIL"]);
	};

	render() {
		if (this.state.loggedInUser === null) {
			return null;
		}

		let viewMembersBtn = (
			<div css={contentItemStyle()} className="content__item">
				<div css={itemLinkStyle(this.context, 0)} className="item__link" onClick={() => this.clickHandler("viewmember", true)}>
					{Translator.translate("VIEW_MEMBERS", this.context.language)}
				</div>
			</div>
		);

		let addMembersBtn = null,
			deleteGroupBtn = null,
			bannedMembersBtn = null;
		if (this.context.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
			addMembersBtn = (
				<div css={contentItemStyle()} className="content__item">
					<div css={itemLinkStyle(this.context, 0)} className="item__link" onClick={() => this.clickHandler("addmember", true)}>
						{Translator.translate("ADD_MEMBERS", this.context.language)}
					</div>
				</div>
			);

			deleteGroupBtn = (
				<div css={contentItemStyle()} className="content__item">
					<span css={itemLinkStyle(this.context, 1)} className="item__link" onClick={this.deleteGroup}>
						{Translator.translate("DELETE_AND_EXIT", this.context.language)}
					</span>
				</div>
			);
		}

		if (this.context.item.scope !== CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
			bannedMembersBtn = (
				<div css={contentItemStyle()} className="content__item">
					<div css={itemLinkStyle(this.context, 0)} className="item__link" onClick={() => this.clickHandler("banmember", true)}>
						{Translator.translate("BANNED_MEMBERS", this.context.language)}
					</div>
				</div>
			);
		}

		let leaveGroupBtn = (
			<div css={contentItemStyle()} className="content__item">
				<span css={itemLinkStyle(this.context, 0)} className="item__link" onClick={this.leaveGroup}>
					{Translator.translate("LEAVE_GROUP", this.context.language)}
				</span>
			</div>
		);

		let sharedmediaView = <CometChatSharedMediaView containerHeight="225px" lang={this.context.language} />;

		if (this.context.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
			//if viewing group membersfeature is disabled
			if (this.state.enableViewGroupMembers === false) {
				viewMembersBtn = null;
			}
		} else if (this.context.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR || this.context.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
			if (this.state.enableViewGroupMembers === false && this.state.enableKickGroupMembers === false && this.state.enableBanGroupMembers === false && this.state.enableChangeScope === false) {
				//if viewing, kicking/banning, promoting/demoting group membersare feature is disabled
				viewMembersBtn = null;
			}
		}

		//if adding group members feature is disabled
		if (this.state.enableAddGroupMembers === false) {
			addMembersBtn = null;
		}

		//if kicking/banning/unbanning group members feature is disabled
		if (this.state.enableBanGroupMembers === false) {
			bannedMembersBtn = null;
		}

		//if deleting group feature is disabled
		if (this.state.enableDeleteGroup === false) {
			deleteGroupBtn = null;
		}

		//if leaving group feature is disabled
		if (this.state.enableLeaveGroup === false || this.context?.item?.membersCount === 1) {
			leaveGroupBtn = null;
		}

		//if viewing shared media group feature is disabled
		if (this.state.enableSharedMedia === false) {
			sharedmediaView = null;
		}

		let members = (
			<div css={sectionStyle()} className="section section__members">
				<h6 css={sectionHeaderStyle(this.context)} className="section__header">
					{Translator.translate("MEMBERS", this.context.language)}
				</h6>
				<div css={sectionContentStyle()} className="section__content">
					{viewMembersBtn}
					{addMembersBtn}
					{bannedMembersBtn}
				</div>
			</div>
		);

		let options = (
			<div css={sectionStyle()} className="section section__options">
				<h6 css={sectionHeaderStyle(this.context)} className="section__header">
					{Translator.translate("OPTIONS", this.context.language)}
				</h6>
				<div css={sectionContentStyle()} className="section__content">
					{leaveGroupBtn}
					{deleteGroupBtn}
				</div>
			</div>
		);

		if (viewMembersBtn === null && addMembersBtn === null && bannedMembersBtn === null) {
			members = null;
		}

		if (leaveGroupBtn === null && deleteGroupBtn === null) {
			options = null;
		}

		let viewMembers = null;
		if (this.state.viewMember) {
			viewMembers = (
				<CometChatViewGroupMemberList
					loggedinuser={this.state.loggedInUser}
					enableChangeScope={this.state.enableChangeScope}
					enableKickGroupMembers={this.state.enableKickGroupMembers}
					enableBanGroupMembers={this.state.enableBanGroupMembers}
					close={() => this.clickHandler("viewmember", false)}
					actionGenerated={this.membersActionHandler}
				/>
			);
		}

		let addMembers = null;
		if (this.state.addMember) {
			addMembers = <CometChatAddGroupMemberList close={() => this.clickHandler("addmember", false)} actionGenerated={this.membersActionHandler} />;
		}

		let bannedMembers = null;
		if (this.state.banMember) {
			bannedMembers = <CometChatBanGroupMemberList loggedinuser={this.state.loggedInUser} close={() => this.clickHandler("banmember", false)} actionGenerated={this.membersActionHandler} />;
		}

		let showDeleteConfirmDialog = null;
		if (this.state.showDeleteConfirmDialog) {
			showDeleteConfirmDialog = (
				<CometChatConfirmDialog {...this.props} onClick={this.onDeleteConfirm} message={Translator.translate("DELETE_CONFIRM", this.context.language)} confirmButtonText={Translator.translate("DELETE", this.context.language)} cancelButtonText={Translator.translate("CANCEL", this.context.language)} />
			);
		}

		let showLeaveGroupConfirmDialog = null;
		if (this.state.showLeaveGroupConfirmDialog) {
			showLeaveGroupConfirmDialog = (
				<CometChatConfirmDialog {...this.props} onClick={this.onLeaveConfirm} message={Translator.translate("LEAVE_CONFIRM", this.context.language)} confirmButtonText={Translator.translate("LEAVE", this.context.language)} cancelButtonText={Translator.translate("CANCEL", this.context.language)} />
			);
		}

		let showTransferOwnershipConfirmDialog = null;
		if (this.state.showTransferOwnershipConfirmDialog) {
			showTransferOwnershipConfirmDialog = (
				<CometChatConfirmDialog
					{...this.props}
					onClick={this.onTransferConfirm}
					message={Translator.translate("TRANSFER_CONFIRM", this.context.language)}
					confirmButtonText={Translator.translate("TRANSFER", this.context.language)}
					cancelButtonText={Translator.translate("CANCEL", this.context.language)}
				/>
			);
		}

		let transferOwnership = null;
		if (this.state.transferOwnership) {
			transferOwnership = <CometChatTransferOwnershipMemberList roles={this.roles} loggedinuser={this.state.loggedInUser} actionGenerated={this.membersActionHandler} close={() => this.clickHandler("transferownership", false)} />;
		}

		return (
			<div css={detailStyle(this.context)} className="detailpane">
				<div css={headerStyle(this.context)} className="detailpane__header">
					<div css={headerCloseStyle(navigateIcon, this.context)} className="header__close" onClick={this.closeGroupDetail}></div>
					<h4 css={headerTitleStyle()} className="header__title">
						{Translator.translate("DETAILS", this.context.language)}
					</h4>
				</div>
				<div css={detailPaneStyle()} className="detailpane__section">
					{members}
					{options}
					{sharedmediaView}
				</div>
				{viewMembers}
				{addMembers}
				{bannedMembers}
				{transferOwnership}
				{showDeleteConfirmDialog}
				{showLeaveGroupConfirmDialog}
				{showTransferOwnershipConfirmDialog}
				<CometChatToastNotification ref={el => (this.toastRef = el)} lang={this.props.lang} />
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

export { CometChatGroupDetails };
