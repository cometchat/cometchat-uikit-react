import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';

import { CometChatManager } from "../../util/controller";
import { SvgAvatar } from '../../util/svgavatar';
import Avatar from "../Avatar";

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

import { theme } from "../../resources/theme";
import Translator from "../../resources/localization/translator";

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
      avatar = (<Avatar image={this.state.user.avatar} borderColor={this.props.theme.borderColor.primary} />);
    }

    return (
      <div css={userInfoScreenStyle(this.props.theme)} className="userinfo">
        <div css={headerStyle(this.props.theme)} className="userinfo__header">
          <h4 css={headerTitleStyle()} className="header__title">{Translator.translate("MORE", this.props.lang)}</h4>
        </div>
        <div css={detailStyle()} className="userinfo__detail">
          <div css={thumbnailStyle()} className="detail__thumbnail">{avatar}</div>
          <div css={userDetailStyle()} className="detail__user" dir={Translator.getDirection(this.props.lang)}>
            <div css={userNameStyle()} className="user__name">{this.state.user.name}</div>
            <p css={userStatusStyle(this.props.theme)} className="user__status">{Translator.translate("ONLINE", this.props.lang)}</p>
          </div>
        </div>
        <div css={optionsStyle()} className="userinfo__options">
          <div css={optionTitleStyle(this.props.theme)} className="options__title">{Translator.translate("PREFERENCES", this.props.lang)}</div>
          <div css={optionListStyle()} className="options_list">
            <div css={optionStyle(notificationIcon)} className="option option-notification">
              <div css={optionNameStyle()} className="option_name">{Translator.translate("NOTIFICATIONS", this.props.lang)}</div>
            </div>
            <div css={optionStyle(privacyIcon)} className="option option-privacy">
              <div css={optionNameStyle()} className="option_name">{Translator.translate("PRIVACY_AND_SECURITY", this.props.lang)}</div>
            </div>
            <div css={optionStyle(chatIcon)} className="option option-chats">
              <div css={optionNameStyle()} className="option_name">{Translator.translate("CHATS", this.props.lang)}</div>
            </div>
          </div>
          <div css={optionTitleStyle(this.props.theme)} className="options__title">{Translator.translate("OTHER", this.props.lang)}</div>
          <div css={optionListStyle()} className="options_list">
            <div css={optionStyle(helpIcon)} className="option option-help">
              <div css={optionNameStyle()} className="option_name">{Translator.translate("HELP", this.props.lang)}</div>
            </div>
            <div css={optionStyle(reportIcon)} className="option option-report">
              <div css={optionNameStyle()} className="option_name">{Translator.translate("REPORT_PROBLEM", this.props.lang)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Specifies the default values for props:
CometChatUserInfoScreen.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

CometChatUserInfoScreen.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default CometChatUserInfoScreen;