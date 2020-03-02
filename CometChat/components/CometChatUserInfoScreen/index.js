import React from "react";
import "./style.scss";
import Avatar from "../Avatar";
import { CometChatManager } from "./controller";
import notificationBlack from "./resources/notification-black-icon.svg";
// import notificationWhite from "./resources/notification-white-icon.svg";
import privacyBlack from "./resources/privacy-black-icon.svg";
// import privacyWhite from "./resources/privacy-white-icon.svg";
import chatBlack from "./resources/chat-black-icon.svg";
// import chatWhite from "./resources/chat-light-grey-icon.svg";
import helpBlack from "./resources/help-black-icon.svg";
// import helpWhite from "./resources/help-white-icon.svg";
import reportBlack from "./resources/report-black-icon.svg";
// import reportWhite from "./resources/report-white-icon.svg";




class CometChatUserInfoScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
    }
  }

  componentDidMount() {
    this.cometChatManager = new CometChatManager();
    this.getProfile();
  }
  static getDerivedStateFromProps(props, state) {
    return props;
  }
  getProfile() {
    this.cometChatManager.isCometChatUserLogedIn().then(
      user => {
        this.setState({ user: user });
      },
      error => {
        //TODO Handle the erros in users logedin state.
        console.error("Handle the erros in conatct List", error);
      }
    );
  }
  render() {
    return (
      <div className="cp-profile-scroll">
        <p className="cp-profile-list-title font-extra-large">More</p>
        <div className="cp-profile-view">
          <div className="row">
            <div className="col-xs-1">

      
              {(Object.keys(this.state.user).length>0?<Avatar src={this.state.user}></Avatar>:'')}
            </div>
            <div className="col cp-user-info">
              <div className="cp-username cp-ellipsis font-bold">
                {this.state.user.name}
              </div>
              <div className=" row cp-userstatus">

                <span >Online </span>
              </div>
            </div>

          </div>
        </div>
        <div className="cp-profile-preferences">
          <p className="text-muted">PREFERENCES</p>
            <div className="row cp-row-padding">
              <div xs={1} className=" col-xs-1 cp-no-padding">
                <img src={notificationBlack} alt="notification"></img>
              </div>
              <div className="col cp-user-info">
                <div className="cp-username cp-ellipsis font-bold">
                  Notifications
              </div>
              </div>

            </div>
            <div className="row cp-list-seperator"></div>
            <div className="row cp-row-padding">
              <div className=" col-xs-1 cp-no-padding">
                <img src={privacyBlack} alt="privacy"></img>
              </div>
              <div className="col cp-user-info">
                <div className="cp-username cp-ellipsis font-bold">
                  Privacy and Security
              </div>
              </div>

            </div>
            <div className="row cp-list-seperator"></div>
            <div className="row cp-row-padding">
              <div xs={1} className="col-xs-1 cp-no-padding">
                <img src={chatBlack} alt="chat"></img>
              </div>
              <div className="col cp-user-info">
                <div className="cp-username cp-ellipsis font-bold">
                  Chats
              </div>
              </div>

            </div>
            <div className="row cp-list-seperator"></div>


        </div>
        <div className="cp-profile-preferences">
          <p className="text-muted">OTHERS</p>
            <div className="row cp-row-padding">
              <div className="col-xs-1 cp-no-padding">
                <img src={helpBlack} alt="help"></img>
              </div>
              <div className="col cp-user-info">
                <div className="cp-username cp-ellipsis font-bold">
                  Help
              </div>
              </div>

            </div>
            <div className="row cp-list-seperator"></div>
            <div className="row cp-row-padding">
              <div  className="col-xs-1 cp-no-padding">
                <img src={reportBlack} alt="report"></img>
              </div>
              <div className="col cp-user-info">
                <div className="cp-username cp-ellipsis font-bold">
                 Report a Problem
              </div>
              </div>

            </div>
            <div className="row cp-list-seperator"></div>
        </div>

      </div>

    );
  }
}
export default CometChatUserInfoScreen;
export const cometChatUserInfoScreen=CometChatUserInfoScreen;

CometChatUserInfoScreen.defaultProps = {
  CometChatUserInfoScreen: {}
};
