import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { CometChatManager } from "../../util/controller";
import { SvgAvatar } from '../../util/svgavatar';
import Avatar from "../Avatar";

import { theme } from "../../resources/theme";

import {
  userInfoScreenStyle,
  headerStyle,
  headerTitleStyle,
  detailStyle,
  thumbnailStyle,
  userDetailStyle,
  userNameStyle,
  userStatusStyle,
  optionsStyle,
  optionTitleStyle,
  optionListStyle,
  optionStyle,
  optionNameStyle
} from "./style";

import notificationIcon from "./resources/notification-black-icon.svg";
import privacyIcon from "./resources/privacy-black-icon.svg";
import chatIcon from "./resources/chat-black-icon.svg";
import helpIcon from "./resources/help-black-icon.svg";
import reportIcon from "./resources/report-black-icon.svg";


class CometChatUserInfoScreen extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      user: {},
    }

    this.theme = Object.assign({}, theme, this.props.theme);
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

    let avatar = null;
    if(Object.keys(this.state.user).length) {
      avatar = (<Avatar 
      image={this.state.user.avatar}
      cornerRadius="50%" 
      borderColor="#CCC" 
      borderWidth="1px" />);
    }

    return (
      <div css={userInfoScreenStyle(this.theme)}>
        <div css={headerStyle(this.theme)}>
          <h4 css={headerTitleStyle()}>More</h4>
        </div>
        <div css={detailStyle()}>
          <div css={thumbnailStyle()}>{avatar}</div>
          <div css={userDetailStyle()}>
            <div css={userNameStyle()}>{this.state.user.name}</div>
            <p css={userStatusStyle(this.theme)}>Online</p>
          </div>
        </div>
        <div css={optionsStyle()}>
          <div css={optionTitleStyle(this.theme)}>Preferences</div>
          <div css={optionListStyle()}>
            <div css={optionStyle(notificationIcon)}><div css={optionNameStyle()}>Notifications</div></div>
            <div css={optionStyle(privacyIcon)}><div css={optionNameStyle()}>Privacy and Security</div></div>
            <div css={optionStyle(chatIcon)}><div css={optionNameStyle()}>Chats</div></div>
          </div>
          <div css={optionTitleStyle(this.theme)}>Other</div>
          <div css={optionListStyle()}>
            <div css={optionStyle(helpIcon)}><div css={optionNameStyle()}>Help</div></div>
            <div css={optionStyle(reportIcon)}><div css={optionNameStyle()}>Report a Problem</div></div>
          </div>
        </div>
      </div>
    );
  }
}

export default CometChatUserInfoScreen;