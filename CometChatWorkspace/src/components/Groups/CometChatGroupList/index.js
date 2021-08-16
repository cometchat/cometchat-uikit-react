import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { GroupListManager } from "./controller";

import { CometChatCreateGroup, CometChatGroupListItem }  from "../../Groups";
import { CometChatToastNotification } from "../../Shared";

import { CometChatContextProvider, CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
  groupWrapperStyle,
  groupHeaderStyle,
  groupHeaderCloseStyle,
  groupHeaderTitleStyle,
  groupAddStyle,
  groupSearchStyle,
  groupSearchButtonStyle,
  groupSearchInputStyle,
  groupMsgStyle,
  groupMsgTxtStyle,
  groupListStyle
} from "./style";

import searchIcon from "./resources/search.svg";
import navigateIcon from "./resources/back.svg";
import addIcon from "./resources/create.svg";

class CometChatGroupList extends React.PureComponent {
	item;
	timeout;
	loggedInUser = null;

	static contextType = CometChatContext;

	constructor(props) {
		super(props);

		this.state = {
			grouplist: [],
			createGroup: false,
			enableSearchGroup: false,
			enableCreateGroup: false,
			enableJoinGroup: false,
			decoratorMessage: Translator.translate("LOADING", props.lang),
		};

		this.contextProviderRef = React.createRef();
		this.groupListRef = React.createRef();
		this.toastRef = React.createRef();

		CometChat.getLoggedinUser()
			.then(user => (this.loggedInUser = user))
			.catch(error => this.setState({ decoratorMessage: Translator.translate("SOMETHING_WRONG", props.lang) }));
	}

	componentDidMount() {
		this.item = this.getContext().type === CometChat.ACTION_TYPE.TYPE_GROUP ? this.getContext().item : null;
		this.enableSearchGroup();
		this.enableCreateGroup();
		this.enableJoinGroup();

		this.GroupListManager = new GroupListManager();
		this.getGroups();
		this.GroupListManager.attachListeners(this.groupUpdated);
	}

	componentDidUpdate(prevProps) {
		//if group detail(membersCount) is updated, update grouplist
		if (this.item && Object.keys(this.item).length && this.getContext().type === CometChat.ACTION_TYPE.TYPE_GROUP && this.item.guid === this.getContext().item.guid && this.item.membersCount !== this.getContext().item.membersCount) {
			const groups = [...this.state.grouplist];

			let groupKey = groups.findIndex(group => group.guid === this.getContext().item.guid);
			if (groupKey > -1) {
				const groupObj = groups[groupKey];
				let newGroupObj = Object.assign({}, groupObj, {membersCount: this.getContext().item.membersCount});

				groups.splice(groupKey, 1, newGroupObj);
				this.setState({grouplist: groups});
			}
		}

		//upon user deleting a group, remove group from group list
		if (this.getContext().deletedGroupId.trim().length) {
			const guid = this.getContext().deletedGroupId.trim();

			const groups = [...this.state.grouplist];
			const groupKey = groups.findIndex(group => group.guid === guid);

			if (groupKey > -1) {
				groups.splice(groupKey, 1);
				this.setState({grouplist: groups});
			}
		}

		this.item = this.getContext().type === CometChat.ACTION_TYPE.TYPE_GROUP ? this.getContext().item : null;
		this.enableSearchGroup();
		this.enableCreateGroup();
		this.enableJoinGroup();
	}

	componentWillUnmount() {
		this.GroupListManager = null;
	}

	/**
	 * if search group feature is disabled
	 */
	enableSearchGroup = () => {
		this.getContext()
			.FeatureRestriction.isGroupSearchEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableSearchGroup) {
					this.setState({enableSearchGroup: response});
				}
			})
			.catch(error => {
				if (this.state.enableSearchGroup !== false) {
					this.setState({enableSearchGroup: false});
				}
			});
	};

	/**
	 * if create group feature is disabled
	 */
	enableCreateGroup = () => {
		this.getContext()
			.FeatureRestriction.isGroupCreationEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableCreateGroup) {
					this.setState({enableCreateGroup: response});
				}
			})
			.catch(error => {
				if (this.state.enableCreateGroup !== false) {
					this.setState({enableCreateGroup: false});
				}
			});
	};

	/**
	 * if join group feature is disabled
	 */
	enableJoinGroup = () => {
		this.getContext()
			.FeatureRestriction.isJoinLeaveGroupsEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableJoinGroup) {
					this.setState({enableJoinGroup: response});
				}
			})
			.catch(error => {
				if (this.state.enableJoinGroup !== false) {
					this.setState({enableJoinGroup: false});
				}
			});
	};

	groupUpdated = (key, message, group, options) => {
		switch (key) {
			case enums.GROUP_MEMBER_SCOPE_CHANGED:
				this.updateMemberChanged(group, options);
				break;
			case enums.GROUP_MEMBER_KICKED:
			case enums.GROUP_MEMBER_BANNED:
			case enums.GROUP_MEMBER_LEFT:
				this.updateMemberRemoved(group, options);
				break;
			case enums.GROUP_MEMBER_ADDED:
				this.updateMemberAdded(group, options);
				break;
			case enums.GROUP_MEMBER_JOINED:
				this.updateMemberJoined(group, options);
				break;
			default:
				break;
		}
	};

	updateMemberRemoved = (group, options) => {
		let grouplist = [...this.state.grouplist];

		//search for group
		let groupKey = grouplist.findIndex(g => g.guid === group.guid);

		if (groupKey > -1) {
			if (options && this.loggedInUser.uid === options.user.uid) {
				let groupObj = {...grouplist[groupKey]};
				let membersCount = parseInt(group.membersCount);
				let hasJoined = group.hasJoined;

				let newgroupObj = Object.assign({}, groupObj, {membersCount: membersCount, hasJoined: hasJoined});

				grouplist.splice(groupKey, 1, newgroupObj);
				this.setState({grouplist: grouplist});
			} else {
				let groupObj = {...grouplist[groupKey]};
				let membersCount = parseInt(group.membersCount);

				let newgroupObj = Object.assign({}, groupObj, {membersCount: membersCount});

				grouplist.splice(groupKey, 1, newgroupObj);
				this.setState({grouplist: grouplist});
			}
		}
	};

	updateMemberAdded = (group, options) => {
		let grouplist = [...this.state.grouplist];

		//search for group
		let groupKey = grouplist.findIndex(g => g.guid === group.guid);

		if (groupKey > -1) {
			let groupObj = {...grouplist[groupKey]};

			let membersCount = parseInt(group.membersCount);

			let scope = group.hasOwnProperty("scope") ? group.scope : "";
			let hasJoined = group.hasOwnProperty("hasJoined") ? group.hasJoined : false;

			if (options && this.loggedInUser.uid === options.user.uid) {
				scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
				hasJoined = true;
			}

			let newgroupObj = Object.assign({}, groupObj, {membersCount: membersCount, scope: scope, hasJoined: hasJoined});

			grouplist.splice(groupKey, 1, newgroupObj);
			this.setState({grouplist: grouplist});
		} else {
			let groupObj = {...group};

			let scope = groupObj.hasOwnProperty("scope") ? groupObj.scope : "";
			let hasJoined = groupObj.hasOwnProperty("hasJoined") ? groupObj.hasJoined : false;
			let membersCount = parseInt(groupObj.membersCount);

			if (options && this.loggedInUser.uid === options.user.uid) {
				scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
				hasJoined = true;
			}

			let newgroupObj = Object.assign({}, groupObj, {membersCount: membersCount, scope: scope, hasJoined: hasJoined});

			grouplist.unshift(newgroupObj);
			this.setState({grouplist: grouplist});
		}
	};

	updateMemberJoined = (group, options) => {
		let grouplist = [...this.state.grouplist];

		//search for group
		let groupKey = grouplist.findIndex(g => g.guid === group.guid);

		if (groupKey > -1) {
			let groupObj = {...grouplist[groupKey]};

			let scope = groupObj.scope;
			let membersCount = parseInt(group.membersCount);

			if (options && this.loggedInUser.uid === options.user.uid) {
				scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
			}

			let newgroupObj = Object.assign({}, groupObj, {membersCount: membersCount, scope: scope});

			grouplist.splice(groupKey, 1, newgroupObj);
			this.setState({grouplist: grouplist});
		}
	};

	updateMemberChanged = (group, options) => {
		let grouplist = [...this.state.grouplist];

		//search for group
		let groupKey = grouplist.findIndex(g => g.guid === group.guid);

		if (groupKey > -1) {
			let groupObj = {...grouplist[groupKey]};
			if (options && this.loggedInUser.uid === options.user.uid) {
				let newgroupObj = Object.assign({}, groupObj, {scope: options.scope});

				grouplist.splice(groupKey, 1, newgroupObj);
				this.setState({grouplist: grouplist});
			}
		}
	};

	handleScroll = e => {
		const bottom = Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
		if (bottom) this.getGroups();
	};

	handleClick = group => {

		if (!this.props.onItemClick) return;

		if (group.hasJoined === false) {

			//if join group feature is disabled
			if (this.state.enableJoinGroup === false) {
				return false;
			}

			let password = "";
			if (group.type === CometChat.GROUP_TYPE.PASSWORD) {
				password = prompt(Translator.translate("ENTER_YOUR_PASSWORD", this.props.lang));
			}

			const guid = group.guid;
			const groupType = group.type;

			CometChat.joinGroup(guid, groupType, password)
				.then(response => {
					if (typeof response === "object" && Object.keys(response).length) {
						const groups = [...this.state.grouplist];

						let groupKey = groups.findIndex((g, k) => g.guid === guid);
						if (groupKey > -1) {
							const groupObj = groups[groupKey];
							const newGroupObj = Object.assign({}, groupObj, response, { scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT });

							groups.splice(groupKey, 1, newGroupObj);
							this.setState({ grouplist: groups });

							this.props.onItemClick(newGroupObj, CometChat.ACTION_TYPE.TYPE_GROUP);
						}
					} else {
						this.toastRef.setError("SOMETHING_WRONG");
					}
				})
				.catch(error => {
				
					if (error.hasOwnProperty("code") && error.code && error.code === "ERR_WRONG_GROUP_PASS") {
						this.toastRef.setError("WRONG_PASSWORD");
					} else {
						this.toastRef.setError("SOMETHING_WRONG");
					}
				
				});

		} else {
			this.props.onItemClick(group, CometChat.ACTION_TYPE.TYPE_GROUP);
		}
	};

	handleMenuClose = () => {
		if (!this.props.actionGenerated) {
			return false;
		}

		this.props.actionGenerated(enums.ACTIONS["TOGGLE_SIDEBAR"]);
	};

	searchGroup = e => {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		let val = e.target.value;
		this.timeout = setTimeout(() => {
			
			this.setState({ grouplist: [], decoratorMessage: Translator.translate("LOADING", this.props.lang) });

			this.GroupListManager = new GroupListManager(val);
			this.getGroups();
		}, 500);
	};

	getGroups = () => {
		this.GroupListManager.fetchNextGroups()
			.then(groupList => {

				if (groupList.length === 0) {

					if (this.state.grouplist.length === 0) {
						this.setState({ decoratorMessage: Translator.translate("NO_GROUPS_FOUND", this.props.lang) });
					}
				} else {
					this.setState({ grouplist: [...this.state.grouplist, ...groupList], decoratorMessage: "" });
				}

			})
			.catch(error => this.setState({ decoratorMessage: Translator.translate("SOMETHING_WRONG", this.props.lang) }));
	};

	createGroupHandler = flag => {
		this.setState({createGroup: flag});
	};

	createGroupActionHandler = (action, group) => {
		if (action === enums.ACTIONS["GROUP_CREATED"]) {
			this.handleClick(group);

			const groupList = [...this.state.grouplist];
			groupList.unshift(group);

			this.setState({grouplist: groupList, createGroup: false});
		}
	};

	getContext = () => {
		if (this.props._parent.length) {
			return this.context;
		} else {
			return this.contextProviderRef.state;
		}
	};

	render() {
		let messageContainer = null;

		if (this.state.decoratorMessage.length !== 0) {
			messageContainer = (
				<div css={groupMsgStyle()} className="groups__decorator-message">
					<p css={groupMsgTxtStyle(theme)} className="decorator-message">
						{this.state.decoratorMessage}
					</p>
				</div>
			);
		}

		const groups = this.state.grouplist.map(group => {
			let selectedGroup = this.getContext().type === CometChat.ACTION_TYPE.TYPE_GROUP && this.getContext().item.guid === group.guid ? group : null;

			return <CometChatGroupListItem key={group.guid} group={group} selectedGroup={selectedGroup} clickHandler={this.handleClick} />;
		});

		let createGroupBtn = (
			<div css={groupAddStyle(addIcon, theme)} title={Translator.translate("CREATE_GROUP", this.props.lang)} onClick={() => this.createGroupHandler(true)}>
				<i></i>
			</div>
		);

		//if create group feature is disabled
		if (this.state.enableCreateGroup === false) {
			createGroupBtn = null;
		}

		let closeBtn = <div css={groupHeaderCloseStyle(navigateIcon, theme)} className="header__close" onClick={this.handleMenuClose}></div>;
		if (this.getContext() && Object.keys(this.getContext().item).length === 0) {
			closeBtn = null;
		}

		let searchGroup = null;
		if (this.state.enableSearchGroup) {
			searchGroup = (
				<div css={groupSearchStyle()} className="groups__search">
					<button type="button" className="search__button" css={groupSearchButtonStyle(searchIcon, this.getContext())} />
					<input type="text" autoComplete="off" css={groupSearchInputStyle()} className="search__input" placeholder={Translator.translate("SEARCH", this.props.lang)} onChange={this.searchGroup} />
				</div>
			);
		}

		let createGroup = null;
		if(this.state.createGroup) {
			createGroup = <CometChatCreateGroup theme={this.props.theme} close={() => this.createGroupHandler(false)} actionGenerated={this.createGroupActionHandler} />;	
		}

		const groupListTemplate = (
			<React.Fragment>
				<div css={groupWrapperStyle(this.props, theme)} className="groups">
					<div css={groupHeaderStyle(theme)} className="groups__header">
						{closeBtn}
						<h4 css={groupHeaderTitleStyle(this.props)} className="header__title" dir={Translator.getDirection(this.props.lang)}>
							{Translator.translate("GROUPS", this.props.lang)}
						</h4>
						{createGroupBtn}
					</div>
					{searchGroup}
					{messageContainer}
					<div css={groupListStyle()} className="groups__list" onScroll={this.handleScroll} ref={el => (this.groupListRef = el)}>
						{groups}
					</div>
				</div>
				{createGroup}
				<CometChatToastNotification ref={el => (this.toastRef = el)} lang={this.props.lang} />
			</React.Fragment>
		);

		let groupListWrapper = groupListTemplate;
		//if used as a standalone component, add errorboundary and context provider
		if (this.props._parent === "") {
			groupListWrapper = <CometChatContextProvider ref={el => (this.contextProviderRef = el)}>{groupListTemplate}</CometChatContextProvider>;
		}

		return groupListWrapper;
	}
}

// Specifies the default values for props:
CometChatGroupList.defaultProps = {
	lang: Translator.getDefaultLanguage(),
	theme: theme,
	onItemClick: () => {},
	_parent: ""
};

CometChatGroupList.propTypes = {
	lang: PropTypes.string,
	theme: PropTypes.object,
	onItemClick: PropTypes.func,
	_parent: PropTypes.string
}

export { CometChatGroupList };