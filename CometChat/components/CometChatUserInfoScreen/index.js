import React from "react";
import "./style.scss";

import { CometChatManager } from "../../util/controller";

import Avatar from "../Avatar";

import notificationBlack from "./resources/notification-black-icon.svg";
import privacyBlack from "./resources/privacy-black-icon.svg";
import chatBlack from "./resources/chat-black-icon.svg";
import helpBlack from "./resources/help-black-icon.svg";
import reportBlack from "./resources/report-black-icon.svg";


class CometChatUserInfoScreen extends React.Component {
  state = {
    user: {},
  }

  componentDidMount() {
    this.getProfile();
  }

  getProfile() {

    new CometChatManager().getLoggedInUser().then(user => {
        this.setState({ user: user });
    }).catch(error => {
      console.log("[CometChatUserInfoScreen] getProfile getLoggedInUser error", error);
    });

  }

  render() {

    let avatar = "";
    if(Object.keys(this.state.user).length) {
      avatar = (<Avatar 
      image={this.state.user.avatar}
      cornerRadius="50%" 
      borderColor="#CCC" 
      borderWidth="1px"></Avatar>);
    }

    return (
    <div className="cp-profile-scroll">
      <p className="cp-profile-list-title font-extra-large">More</p>
      <div className="cp-profile-view">
        <div className="row">
          <div className="col-xs-1">{avatar}</div>
          <div className="col cp-user-info">
            <div className="cp-username cp-ellipsis font-bold">{this.state.user.name}</div>
            <div className=" row cp-userstatus"><span>Online</span></div>
          </div>
        </div>
      </div>

      <div className="cp-profile-preferences">
        <p className="text-muted">PREFERENCES</p>
        <div className="row cp-row-padding">
          <div xs={1} className=" col-xs-1 cp-no-padding"><img src={notificationBlack} alt="notification"></img></div>
          <div className="col cp-user-info">
            <div className="cp-username cp-ellipsis font-bold">Notifications</div>
          </div>
        </div>
        <div className="row cp-list-seperator"></div>
        <div className="row cp-row-padding">
          <div className=" col-xs-1 cp-no-padding"><img src={privacyBlack} alt="privacy"></img></div>
          <div className="col cp-user-info">
            <div className="cp-username cp-ellipsis font-bold">Privacy and Security</div>
          </div>
        </div>
        <div className="row cp-list-seperator"></div>
        <div className="row cp-row-padding">
          <div xs={1} className="col-xs-1 cp-no-padding"><img src={chatBlack} alt="chat"></img></div>
          <div className="col cp-user-info">
            <div className="cp-username cp-ellipsis font-bold">Chats</div>
          </div>
        </div>
        <div className="row cp-list-seperator"></div>
      </div>

      <div className="cp-profile-preferences">
        <p className="text-muted">OTHERS</p>
        <div className="row cp-row-padding">
          <div className="col-xs-1 cp-no-padding"><img src={helpBlack} alt="help"></img></div>
          <div className="col cp-user-info">
            <div className="cp-username cp-ellipsis font-bold">Help</div>
          </div>
        </div>
        <div className="row cp-list-seperator"></div>
        <div className="row cp-row-padding">
          <div  className="col-xs-1 cp-no-padding"><img src={reportBlack} alt="report"></img></div>
          <div className="col cp-user-info">
            <div className="cp-username cp-ellipsis font-bold">Report a Problem</div>
          </div>
        </div>
        <div className="row cp-list-seperator"></div>
      </div>

    </div>);
  }
}

export default CometChatUserInfoScreen;