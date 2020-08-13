import React from "react";
import "./style.scss";

import { CometChatManager } from "../../util/controller";
import { SvgAvatar } from '../../util/svgavatar';
import { UserListManager } from "./controller";

import UserView from "../UserView";

class CometChatUserList extends React.PureComponent {
  timeout;
  friendsOnly = false;

  constructor(props) {
    super(props);
    this.state = {
      userlist: [],
      loading: false
    }
  }

  componentDidMount() {

    if(this.props?.friendsOnly) {
      this.friendsOnly = this.props.friendsOnly;
    }

    this.UserListManager = new UserListManager(this.friendsOnly);
    this.getUsers();
    this.UserListManager.attachListeners(this.userUpdated);
  }

  componentDidUpdate(prevProps, prevState) {

    //if user is blocked/unblocked, update userlist in state
    if(prevProps.item 
    && Object.keys(prevProps.item).length 
    && prevProps.item.uid === this.props.item.uid 
    && prevProps.item.blockedByMe !== this.props.item.blockedByMe) {

      let userlist = [...this.state.userlist];
      let userObj = userlist.find((u, k) => u.uid === this.props.item.uid);

      if(userObj) {
        userObj = Object.assign(userObj, {blockedByMe: this.props.item.blockedByMe});
      }
      
      this.setState({ userlist });
    }
  }

  componentWillUnmount() {

    this.UserListManager.removeListeners();
    this.UserListManager = null;
  }

  userUpdated = (user) => {
    
    let userlist = [...this.state.userlist];

    //search for user
    let userKey = userlist.findIndex((u, k) => u.uid === user.uid);
    
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

    this.props.onItemClick(user, 'user');
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

    this.setState({loading: true});
    new CometChatManager().getLoggedInUser().then((user) => {

      this.UserListManager.fetchNextUsers().then((userList) => {
        
        userList.forEach(user => user = this.setAvatar(user));
        this.setState({ userlist: [...this.state.userlist, ...userList], loading: false });
          
      }).catch((error) => {
        console.error("[CometChatUserList] getUsers fetchNext error", error);
        this.setState({loading: false});
      });

    }).catch((error) => {
      console.log("[CometChatUserList] getUsers getLoggedInUser error", error);
      this.setState({loading: false});
    });
  }

  setAvatar(user) {

    if(!user.getAvatar()) {

      const uid = user.getUid();
      const char = user.getName().charAt(0).toUpperCase();
      user.setAvatar(SvgAvatar.getAvatar(uid, char))
    }

  }

  render() {
    
    const userList = [...this.state.userlist];
    let currentLetter = "";
    const users = userList.map((user, key) => {
      
      const chr = user.name[0].toUpperCase();
      if (chr !== currentLetter) {

        currentLetter = chr;
        return (
          <div id={key} onClick={() => this.handleClick(user)} key={key}>
            <span className='chat-contact-list-apla-ftlr'>{currentLetter}</span>
            <UserView key={user.uid} user={user}  ></UserView>
          </div>
        );

      } else {

        return (
          <div id={key} onClick={() => this.handleClick(user)} key={key}>
            <UserView key={user.uid} user={user}></UserView>
          </div>
        );
      }

    });

    let closeBtn = (<div className="cc1-left-panel-close" onClick={this.handleMenuClose}></div>);
    if(this.props.hasOwnProperty("enableCloseMenu") && this.props.enableCloseMenu === 0) {
      closeBtn = null;
    }

    return (
      <React.Fragment>
        <div className="ccl-left-panel-head-wrap">
          {closeBtn}
          <h4 className="ccl-left-panel-head-ttl">Contacts</h4>
        </div>
        <div className="ccl-left-panel-srch-wrap">
          <div className="ccl-left-panel-srch-inpt-wrap">
              <input
              type="text" 
              autoComplete="off" 
              className="ccl-left-panel-srch" 
              id="chatSearch" 
              placeholder="Search"
              onChange={this.searchUsers} />
              <input id="searchButton" type="button" className="search-btn" />
          </div>
        </div>
        <div className="chat-contact-list-ext-wrap" onScroll={this.handleScroll}>
          {users}
        </div>
      </React.Fragment>
    );
  }
}

export default CometChatUserList;
