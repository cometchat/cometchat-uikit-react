import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { UserListManager } from "./controller";

import { CometChatUserListItem } from "../../Users";

import { CometChatContextProvider, CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import { 
  contactWrapperStyle, 
  contactHeaderStyle, 
  contactHeaderCloseStyle, 
  contactHeaderTitleStyle,
  contactSearchStyle,
  contactSearchButtonStyle,
  contactSearchInputStyle,
  contactMsgStyle,
  contactMsgTxtStyle,
  contactListStyle,
  contactAlphabetStyle
} from "./style";

import searchIcon from "./resources/search.svg";
import navigateIcon from "./resources/back.svg";

class CometChatUserList extends React.PureComponent {

	item;
	timeout;
	static contextType = CometChatContext;

	constructor(props) {

		super(props);

		this.state = {
			userlist: [],
			enableSearchUser: false,
			decoratorMessage: Translator.translate("LOADING", props.lang),
		};

		this.contextProviderRef = React.createRef();
		this.userListRef = React.createRef();

		CometChat.getLoggedinUser()
			.then(user => (this.loggedInUser = user))
			.catch(error => this.setState({ decoratorMessage: Translator.translate("SOMETHING_WRONG", this.props.lang) }));
	}

	componentDidMount() {

		this.item = (this.getContext().type === CometChat.ACTION_TYPE.TYPE_USER) ? this.getContext().item : null;
		this.toggleUserSearch();

		this.UserListManager = new UserListManager(this.getContext())
		this.UserListManager.initializeUsersRequest()
			.then(response => {
				this.getUsers();
				this.UserListManager.attachListeners(this.userUpdated);
			})
			.catch(error => this.setState({ decoratorMessage: Translator.translate("SOMETHING_WRONG", this.props.lang) }));
	}

	componentDidUpdate(prevProps) {

		//if user is blocked/unblocked, update userlist
		if (this.item 
		&& Object.keys(this.item).length
		&& this.getContext().type === CometChat.ACTION_TYPE.TYPE_USER && this.item.uid === this.getContext().item.uid
		&& this.item.blockedByMe !== this.getContext().item.blockedByMe) {

			let userlist = [...this.state.userlist];

				//search for user
				let userKey = userlist.findIndex(u => u.uid === this.getContext().item.uid);
				if(userKey > -1) {

				let userObject = { ...userlist[userKey] };
				let newUserObject = Object.assign({}, userObject, { blockedByMe: this.getContext().item.blockedByMe });
				
				userlist.splice(userKey, 1, newUserObject);
				this.setState({ userlist: userlist });
			}
		}

		this.item = (this.getContext().type === CometChat.ACTION_TYPE.TYPE_USER) ? this.getContext().item : null;
		this.toggleUserSearch();
	}

	componentWillUnmount() {

		this.UserListManager.removeListeners();
		this.UserListManager = null;
	}

	toggleUserSearch = () => {

		this.getContext().FeatureRestriction.isUserSearchEnabled().then(response => {

			/**
			* Don't update state if the response has the same value
			*/
			if (response !== this.state.enableSearchUser) {
				this.setState({enableSearchUser: response});
			}

		}).catch(error => {

			if (this.state.enableSearchUser !== false) {
				this.setState({enableSearchUser: false});
			}

		});
	}

	userUpdated = (user) => {
		
		let userlist = [...this.state.userlist];

		//search for user
		let userKey = userlist.findIndex(u => u.uid === user.uid);
		
		//if found in the list, update user object
		if(userKey > -1) {

			let userObj = {...userlist[userKey]};
			let newUserObj = {...userObj, ...user};
			userlist.splice(userKey, 1, newUserObj);

			this.setState({ userlist: userlist });
		}
	}

	handleScroll = (e) => {

		const bottom =
		Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
		if (bottom) this.getUsers();
	}

	handleClick = (user) => {

		if(!this.props.onItemClick)
			return;

		this.props.onItemClick(user, CometChat.ACTION_TYPE.TYPE_USER);
	}

  	handleMenuClose = () => {

		if(!this.props.actionGenerated) {
			return false;
		}

		this.props.actionGenerated(enums.ACTIONS["TOGGLE_SIDEBAR"]);
  	}
  
 	searchUsers = (e) => {

		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		let val = e.target.value;
		this.UserListManager = new UserListManager(this.getContext(), val);
		this.UserListManager.initializeUsersRequest()
			.then(response => {
				this.timeout = setTimeout(() => {
					this.setState({ userlist: [], decoratorMessage: Translator.translate("LOADING", this.props.lang) }, () => this.getUsers());
				}, 500);
			})
			.catch(error => this.setState({ decoratorMessage: Translator.translate("SOMETHING_WRONG", this.props.lang) }));
  	}

	getUsers = () => {

		this.UserListManager.fetchNextUsers()
			.then(userList => {

				if (userList.length === 0) {
					if (this.state.userlist.length === 0) {
						this.setState({ decoratorMessage: Translator.translate("NO_USERS_FOUND", this.props.lang) });
					}
				} else {
					this.setState({ userlist: [...this.state.userlist, ...userList], decoratorMessage: "" });
				}
				
			})
			.catch(error => this.setState({ decoratorMessage: Translator.translate("SOMETHING_WRONG", this.props.lang) }));
	}

	getContext = () => {

		if (this.props._parent.length) {
			return this.context;
		} else {
			return this.contextProviderRef.state;
		}
	}

  	render() {

		let messageContainer = null;
		if (this.state.decoratorMessage.length !== 0) {
			messageContainer = (
				<div css={contactMsgStyle()} className="contacts__decorator-message">
					<p css={contactMsgTxtStyle(theme)} className="decorator-message">
						{this.state.decoratorMessage}
					</p>
				</div>
			);
		}

		const userList = [...this.state.userlist];
		let currentLetter = "";
		
		const users = userList.map(user => {
		
			const chr = user.name[0].toUpperCase();
			let firstChar = null;
			if (chr !== currentLetter) {
				currentLetter = chr;
				firstChar = (<div css={contactAlphabetStyle(this.props)} className="contacts__list__alphabet-filter">{currentLetter}</div>);
			} else {
				firstChar = null;
			}
			
			let selectedUser = (this.getContext().type === CometChat.ACTION_TYPE.TYPE_USER && this.getContext().item.uid === user.uid) ? user : null;

			return (
				<React.Fragment key={user.uid}>
					{firstChar}
					<CometChatUserListItem user={user} selectedUser={selectedUser} clickHandler={this.handleClick} />
				</React.Fragment>
			);

		});

		let closeBtn = <div css={contactHeaderCloseStyle(navigateIcon, theme)} className="header__close" onClick={this.handleMenuClose}></div>;
		if (this.getContext() && Object.keys(this.getContext().item).length === 0) {
			closeBtn = null;
		}

		let searchUser = null;
		if (this.state.enableSearchUser) {
			searchUser = (
				<div css={contactSearchStyle()} className="contacts__search">
					<button type="button" className="search__button" css={contactSearchButtonStyle(searchIcon, theme)} />
					<input type="text" autoComplete="off" css={contactSearchInputStyle(this.props)} className="search__input" placeholder={Translator.translate("SEARCH", this.props.lang)} onChange={this.searchUsers} />
				</div>
			);
		}

		const userListTemplate = (
			<div css={contactWrapperStyle(this.props, theme)} className="contacts">
				<div css={contactHeaderStyle(theme)} className="contacts__header">
					{closeBtn}
					<h4 css={contactHeaderTitleStyle(this.props)} className="header__title" dir={Translator.getDirection(this.props.lang)}>
						{Translator.translate("USERS", this.props.lang)}
					</h4>
					<div></div>
				</div>
				{searchUser}
				{messageContainer}
				<div css={contactListStyle()} className="contacts__list" onScroll={this.handleScroll} ref={el => (this.userListRef = el)}>
					{users}
				</div>
			</div>
		);

		let userListWrapper = (userListTemplate);
		if (this.props._parent === "") {
			userListWrapper = (
				<CometChatContextProvider ref={el => (this.contextProviderRef = el)}>
					{userListTemplate}
				</CometChatContextProvider>
			);
		}

		return (userListWrapper);
  	}
}

// Specifies the default values for props:
CometChatUserList.defaultProps = {
	lang: Translator.getDefaultLanguage(),
	theme: theme,
	onItemClick: () => {},
	_parent: ""
};

CometChatUserList.propTypes = {
	lang: PropTypes.string,
	theme: PropTypes.object,
	onItemClick: PropTypes.func,
	_parent: PropTypes.string
}

export { CometChatUserList };
