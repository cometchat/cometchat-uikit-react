import React from "react";
import "./style.scss";
import UserView from "../UserView";
import { CometChatManager } from "./controller";

class CometChatUserList extends React.Component {
  timeout;
  constructor(props) {
    super(props);
    this.state = {
      userlist: [],
      onItemClick: null
    }
    this.getUsersList = this.getUsersList.bind(this);
    this.handleScroll = this.handleScroll.bind(this);

  }
  componentDidMount() {
    this.cometChatManager = new CometChatManager();
    this.getUsersList();
    this.cometChatManager.attachUserListener(this.userUpdated);
  }
  // static getDerivedStateFromProps(props,state){    
  //   return props;
  // }
  handleScroll(e) {
    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
    if (bottom) this.getUsersList();
  }


  handleClick = (user) => {
    this.props.onItemClick(user, 'user');
  }


  userUpdated = (user) => {
    if (this.state.userlist) {
      let userlist = this.state.userlist;

      userlist.map((stateUser, key) => {
        if (stateUser.uid === user.uid) {
          userlist.splice(key, 1, user);

          return true;
        }
        return true;
      });
      this.setState({ userlist });
    }

  }
  searchUsers = (e) => {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    let val=e.target.value;
    this.timeout = setTimeout(() => {
      this.cometChatManager = new CometChatManager(val);
      this.setState({ userlist: [] }, () => {
        this.getUsersList();
      })
    }, 500)


  }

  getUsersList() {
    this.cometChatManager.isCometChatUserLogedIn().then(
      user => {
        this.cometChatManager.fetchNextContacts().then(
          (userlist) => {
            this.setState({ userlist: [...this.state.userlist, ...userlist] });
          },
          error => {
            //TODO Handle the erros in conatct List.
            console.error("Handle the erros in conatct List", error);
          }
        );
      },
      error => {
        //TODO Handle the erros in users logedin state.
        console.error("Handle the erros in conatct List", error);
      }
    );
  }

  displayUserList() {
    let currentLetter = "";
    if (this.state.userlist.length > 0) {
      return this.state.userlist.map((user, key) => {
        if (user.name.substring(0, 1).toUpperCase() !== currentLetter) {
          currentLetter = user.name.substring(0, 1).toUpperCase();
          return (
            <div id={key} onClick={() => this.handleClick(user)} key={user.uid}>
              <div className="cp-contact-alphabet font-bold">{currentLetter}</div>
              <UserView key={user.uid} user={user}></UserView>
              <div className="row cp-list-seperator"></div>
            </div>
          );
        } else {
          return (
            <div id={key} onClick={() => this.handleClick(user)} key={user.uid}>
              <UserView key={user.uid} user={user}></UserView>
              <div className="row cp-list-seperator"></div>

            </div>
          );
        }

        // return 
        // <div key={user.uid}>
        //   <UserView onClick={this.state.onItemClick} key={user.uid} user={user}></UserView>
        //   <Row className="cp-list-seperator"></Row>
        // </div>
        // return true;
      });

    }
  }
  render() {
    return (
      <div className="cp-userlist-wrapper" >
        <p className="cp-contact-list-title font-extra-large">Contacts</p>
        <p className="cp-searchbar">
          <input className="font-normal" type="text" placeholder="Search" aria-label="Search" onChange={this.searchUsers} />
        </p>
        <div className="cp-userlist" onScroll={this.handleScroll}>

          {this.displayUserList()}
        </div>
      </div>

    );
  }
}



export default CometChatUserList;
export const cometChatUserList=CometChatUserList;

CometChatUserList.defaultProps = {
  CometChatUserList: {}
};
