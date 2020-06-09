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
      userlist: []
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
    let index = userlist.findIndex((u, k) => u.uid === user.uid);
    let userObj = userlist.find((u, k) => u.uid === user.uid);
    
    //if found in the list, update user object
    if(userObj) {

      userObj = Object.assign(userObj, user);
      userlist.splice(index, 1, userObj);

      this.setState({ userlist: userlist });

      if(this.props.userStatusChanged && this.props.item.uid === user.uid) {
        this.props.userStatusChanged(userObj);
      }
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

    new CometChatManager().getLoggedInUser().then((user) => {

      this.UserListManager.fetchNextUsers().then((userList) => {
        
        userList.forEach(user => user = this.setAvatar(user));
        this.setState({ userlist: [...this.state.userlist, ...userList] });
          
      }).catch((error) => {
        console.error("[CometChatUserList] getUsers fetchNext error", error);
      });

    }).catch((error) => {
      console.log("[CometChatUserList] getUsers getLoggedInUser error", error);
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
            <div className="cp-contact-alphabet font-bold">{currentLetter}</div>
            <UserView key={user.uid} user={user}></UserView>
            <div className="row cp-list-seperator"></div>
          </div>
        );

      } else {

        return (
          <div id={key} onClick={() => this.handleClick(user)} key={key}>
            <UserView key={user.uid} user={user}></UserView>
            <div className="row cp-list-seperator"></div>
          </div>
        );
      }

    });

    return (

      <div className="cp-userlist-wrapper" >
        <p className="cp-contact-list-title font-extra-large">Contacts</p>
        <p className="cp-searchbar">
          <input className="font-normal" type="text" placeholder="Search" aria-label="Search" onChange={this.searchUsers} />
        </p>
        <div className="cp-userlist" onScroll={this.handleScroll}>{users}</div>
      </div>

    );
  }
}

export default CometChatUserList;