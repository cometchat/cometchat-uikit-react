import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { UserListManager } from "./controller";

import { CometChatUserListItem } from "../../Users";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import { 
  contactWrapperStyle, 
  contactHeaderStyle, 
  contactHeaderCloseStyle, 
  contactHeaderTitleStyle,
  contactSearchStyle,
  contactSearchInputStyle,
  contactMsgStyle,
  contactMsgTxtStyle,
  contactListStyle,
  contactAlphabetStyle
} from "./style";

import searchIcon from "./resources/search-grey-icon.png";
import navigateIcon from "./resources/navigate.png";

class CometChatUserList extends React.PureComponent {
  timeout;
  friendsOnly = false;

  constructor(props) {

    super(props);

    this.state = {
      userlist: props.userlist,
      selectedUser: null,
      lang: props.lang
    }
    
    this.decoratorMessage = Translator.translate("LOADING", props.lang);
    this.userListRef = React.createRef();
  }

  componentDidMount() {

    if(this.props.hasOwnProperty("friendsOnly")) {
      this.friendsOnly = this.props.friendsOnly;
    }

    if(this.props.hasOwnProperty("widgetsettings") 
    && this.props.widgetsettings
    && this.props.widgetsettings.hasOwnProperty("sidebar") 
    && this.props.widgetsettings.sidebar.hasOwnProperty("user_listing")) {

      switch(this.props.widgetsettings.sidebar["user_listing"]) {
        case "friends":
          this.friendsOnly = true;
        break;
        default:
        break;
      }
    }

    this.UserListManager = new UserListManager(this.friendsOnly);
    this.getUsers();
    this.UserListManager.attachListeners(this.userUpdated);
  }

  componentDidUpdate(prevProps) {

    const previousItem = JSON.stringify(prevProps.item);
    const currentItem = JSON.stringify(this.props.item);

    if (previousItem !== currentItem) {

      if (Object.keys(this.props.item).length === 0) {

        this.userListRef.scrollTop = 0;
        this.setState({ selectedUser: {} });

      } else {

        let userlist = [...this.state.userlist];

        //search for user
        let userKey = userlist.findIndex(u => u.uid === this.props.item.uid);
        if (userKey > -1) {

          let userObj = { ...userlist[userKey] };
          this.setState({ selectedUser: userObj });
        }
      }
    }

    //if user is blocked/unblocked, update userlist in state
    if(prevProps.item 
    && Object.keys(prevProps.item).length 
    && prevProps.item.uid === this.props.item.uid 
    && prevProps.item.blockedByMe !== this.props.item.blockedByMe) {

      let userlist = [...this.state.userlist];

      //search for user
      let userKey = userlist.findIndex((u, k) => u.uid === this.props.item.uid);
      if(userKey > -1) {

        let userObj = {...userlist[userKey]};
        let newUserObj = Object.assign({}, userObj, {blockedByMe: this.props.item.blockedByMe});
        userlist.splice(userKey, 1, newUserObj);

        this.setState({ userlist: userlist });
      }
    }

    if (prevProps.lang !== this.props.lang) {
      this.setState({ lang: this.props.lang });
    }
  }

  componentWillUnmount() {

    this.UserListManager.removeListeners();
    this.UserListManager = null;
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

    //this.setState({selectedUser: {...user}});
    this.props.onItemClick(user, "user");
  }

  handleMenuClose = () => {

    if(!this.props.actionGenerated) {
      return false;
    }

    this.props.actionGenerated("closeMenuClicked")
  }
  
  searchUsers = (e) => {

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    let val = e.target.value;
    this.timeout = setTimeout(() => {

      this.UserListManager = new UserListManager(this.friendsOnly, val);
      this.setState({ userlist: [] }, () => this.getUsers())
    }, 500)

  }

  getUsers = () => {

    CometChat.getLoggedinUser().then((user) => {

      this.UserListManager.fetchNextUsers().then((userList) => {

        if(userList.length === 0) {
          this.decoratorMessage = Translator.translate("NO_USERS_FOUND", this.state.lang);
        }
        
        this.setState({ userlist: [...this.state.userlist, ...userList] });
          
      }).catch((error) => {

        this.decoratorMessage = Translator.translate("ERROR", this.state.lang);
        console.error("[CometChatUserList] getUsers fetchNext error", error);
      });

    }).catch((error) => {

      this.decoratorMessage = Translator.translate("ERROR", this.state.lang);
      console.log("[CometChatUserList] getUsers getLoggedinUser error", error);
    });
  }

  render() {

    let messageContainer = null;
    if(this.state.userlist.length === 0) {
      messageContainer = (
        <div css={contactMsgStyle()} className="contacts__decorator-message">
          <p css={contactMsgTxtStyle(this.props)} className="decorator-message">{this.decoratorMessage}</p>
        </div>
      );
    }

    const userList = [...this.state.userlist];
    let currentLetter = "";
    const users = userList.map((user, key) => {
      
      const chr = user.name[0].toUpperCase();
      let firstChar = null;
      if (chr !== currentLetter) {
        currentLetter = chr;
        firstChar = (<div css={contactAlphabetStyle()} className="contacts__list__alphabet-filter">{currentLetter}</div>);
      } else {
        firstChar = null;
      }

      return (
        <React.Fragment key={key}>
          {firstChar}
          <CometChatUserListItem 
          theme={this.props.theme}
          user={user} 
          selectedUser={this.state.selectedUser}
          lang={this.state.lang}
          widgetsettings={this.props.widgetsettings} 
          clickHandler={this.handleClick}  />
        </React.Fragment>
      );

    });

    let closeBtn = (<div css={contactHeaderCloseStyle(navigateIcon, this.props)} className="header__close" onClick={this.handleMenuClose}></div>);
    if (!this.props.hasOwnProperty("enableCloseMenu") || (this.props.hasOwnProperty("enableCloseMenu") && this.props.enableCloseMenu === 0)) {
      closeBtn = null;
    }

    return (
      <div css={contactWrapperStyle()} className="contacts">
        <div css={contactHeaderStyle(this.props.theme)} className="contacts__header">
          {closeBtn}
          <h4 css={contactHeaderTitleStyle(this.props)} className="header__title" dir={Translator.getDirection(this.state.lang)}>{Translator.translate("USERS", this.state.lang)}</h4>
          <div></div>
        </div>
        <div css={contactSearchStyle()} className="contacts__search">
          <input
          type="text" 
          autoComplete="off" 
          css={contactSearchInputStyle(this.props, searchIcon)}
          className="search__input" 
          placeholder={Translator.translate("SEARCH", this.state.lang)}
          onChange={this.searchUsers} />
        </div>
        {messageContainer}
        <div css={contactListStyle()} className="contacts__list" onScroll={this.handleScroll} ref={el => this.userListRef = el}>{users}</div>
      </div>
    );
  }
}

// Specifies the default values for props:
CometChatUserList.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
  userlist: [],
  onItemClick: () => {}
};

CometChatUserList.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object,
  userlist: PropTypes.arrayOf(PropTypes.shape(CometChat.User)),
  onItemClick: PropTypes.func
}

export default CometChatUserList;
