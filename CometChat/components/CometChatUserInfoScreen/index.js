import React from "react";
import "./style.scss";

import { CometChatManager } from "../../util/controller";
import { SvgAvatar } from '../../util/svgavatar';
import Avatar from "../Avatar";

class CometChatUserInfoScreen extends React.Component {
  state = {
    user: {},
  }

  componentDidMount() {
    this.getProfile();
  }

  getProfile() {

    new CometChatManager().getLoggedInUser().then(user => {

        this.setAvatar(user);
        this.setState({ user: user });
    }).catch(error => {
      console.log("[CometChatUserInfoScreen] getProfile getLoggedInUser error", error);
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

    let avatar = "";
    if(Object.keys(this.state.user).length) {
      avatar = (<Avatar 
      image={this.state.user.avatar}
      cornerRadius="50%" 
      borderColor="#CCC" 
      borderWidth="1px"></Avatar>);
    }

    return (
      <React.Fragment>
        <div className="ccl-left-panel-head-wrap">
          <h4 className="ccl-left-panel-head-ttl">More</h4>
        </div>
        <div className="cc1-left-panel-user">
          <div className="cc1-left-panel-user-thumbnail-wrap">{avatar}</div>
          <div className="cc1-left-panel-user-dtls">
            <div className="cc1-left-panel-user-name">{this.state.user.name}</div>
            <p className="cc1-left-panel-user-status">Online</p>
          </div>
        </div>
        <div className="cc1-left-panel-myacc-opts-wrap">
          <div className="cc1-left-panel-myacc-opts-list-ttl">Preferences</div>
          <div className="cc1-left-panel-myacc-opts-list">
              <div className="cc1-left-panel-myacc-opt notifications">
                <span className="cc1-left-panel-myacc-optname"></span>Notifications
              </div>
              <div className="cc1-left-panel-myacc-opt privacy"><span className="cc1-left-panel-myacc-optname"></span>Privacy and Security</div>
              <div className="cc1-left-panel-myacc-opt chats"><span className="cc1-left-panel-myacc-optname"></span>Chats</div>
          </div>
          <div className="cc1-left-panel-myacc-opts-list-ttl">Other</div>
          <div className="cc1-left-panel-myacc-opts-list">
              <div className="cc1-left-panel-myacc-opt help"><span className="cc1-left-panel-myacc-optname"></span>Help</div>
              <div className="cc1-left-panel-myacc-opt report"><span className="cc1-left-panel-myacc-optname"></span>Report a Problem</div>
          </div>
        </div>
      </React.Fragment>

    /*{ <div className="cp-profile-scroll">
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

    </div> }*/
    );
  }
}

export default CometChatUserInfoScreen;