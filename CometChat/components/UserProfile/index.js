import React from "react";
import "./style.scss";
import { CometChat } from "@cometchat-pro/chat";



class UserProfile extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      src: "",
      activeTab: 'contacts'
    }
  }

  onTabChange(tab) {
    this.setState({
      activeTab: tab
    })

  }
  blockUser=()=>{
    let usersList = [this.state.item.uid];
    CometChat.blockUsers(usersList).then(
  list => {
    this.setState(prevState => ({
      item: {                  
          ...prevState.item,    
          blockedByMe: true      
      }
  }))
  },
  error => {
    console.log("Blocking user fails with error", error);
  }
);

  }
  unblockUser=()=>{
    let usersList = [this.state.item.uid];
CometChat.unblockUsers(usersList).then(
  list => {
    this.setState(prevState => ({
      item: {                  
          ...prevState.item,    
          blockedByMe: false      
      }
  }))
  },
  error => {
    console.log("unblocking user fails with error", error);
  }
);
  }
  static getDerivedStateFromProps(props, state) {
    return {...props,...state};

  }
  render() {
    return (
      <div className="cp-user-profile-scroll">
        <p className="cp-profile-list-title font-extra-large">Details</p>
        <div className="cp-profile-view">
          <div className="cp-username cp-ellipsis font-bold">
            Notifications
            </div>
        </div>

        <div className="cp-user-block">
          <p className="text-muted">Privacy and Support</p>
          <div className="row">
            <div className="col cp-user-block-info">
              {this.state.type ==='user'?<div className="cp-username cp-ellipsis font-bold">
              {!this.state.item.blockedByMe?<button onClick={this.blockUser} className="cp-block-user-button">Block User</button>:""} 
              {this.state.item.blockedByMe?<button onClick={this.unblockUser} className="cp-block-user-button">Unblock User</button>:""}  
            </div>:""}
            </div>

          </div>
        </div>

      </div>
    )
  }
}



export default UserProfile;
export const userProfile=UserProfile;

UserProfile.defaultProps = {
  src: ""
};

