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
      <div css={userInfoScreenStyle(this.theme)} className="userinfo">
        <div css={headerStyle(this.theme)} className="userinfo__header">
          <h4 css={headerTitleStyle()} className="header__title">More</h4>
        </div>
        <div css={detailStyle()} className="userinfo__detail">
          <div css={thumbnailStyle()} className="detail__thumbnail">{avatar}</div>
          <div css={userDetailStyle()} className="detail__user">
            <div css={userNameStyle()} className="user__name">{this.state.user.name}</div>
            <p css={userStatusStyle(this.theme)} className="user__status">Online</p>
          </div>
        </div>
        <div css={optionsStyle()} className="userinfo__options">
          <div css={optionTitleStyle(this.theme)} className="options__title">Preferences</div>
          <div css={optionListStyle()} className="options_list">
            <div css={optionStyle(notificationIcon)} className="option option-notification">
              <div css={optionNameStyle()} className="option_name">Notifications</div>
            </div>
            <div css={optionStyle(privacyIcon)} className="option option-privacy">
              <div css={optionNameStyle()} className="option_name">Privacy and Security</div>
            </div>
            <div css={optionStyle(chatIcon)} className="option option-chats">
              <div css={optionNameStyle()} className="option_name">Chats</div>
            </div>
          </div>
          <div css={optionTitleStyle(this.theme)} className="options__title">Other</div>
          <div css={optionListStyle()} className="options_list">
            <div css={optionStyle(helpIcon)} className="option option-help">
              <div css={optionNameStyle()} className="option_name">Help</div>
            </div>
            <div css={optionStyle(reportIcon)} className="option option-report">
              <div css={optionNameStyle()} className="option_name">Report a Problem</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CometChatUserInfoScreen;