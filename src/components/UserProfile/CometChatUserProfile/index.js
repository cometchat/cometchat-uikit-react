import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatAvatar, CometChatToastNotification } from "../../Shared";
import { CometChatUserProfileItem } from "..";
import { localize } from "../..";

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
  optionNameStyle,
} from "./style";

import notificationIcon from "./resources/notify.svg";
import privacyIcon from "./resources/privacy.svg";
import chatIcon from "./resources/chats.svg";
import helpIcon from "./resources/help.svg";
import reportIcon from "./resources/warning.svg";
import { hooks } from "./hooks";

const CometChatUserProfile = (props) => {
  const [loggedInUser, setLoggedInUser] = React.useState(null);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    let userProfile = null;
    if (loggedInUser) {
      //let avatar = <CometChatAvatar user={state.loggedInUser} />;
      userProfile = (
        <React.Fragment>
          <div css={headerStyle(props)} className="userinfo__header">
            <h4 css={headerTitleStyle(props)} className="header__title">
              {props.title}
            </h4>
          </div>
          <CometChatUserProfileItem user={loggedInUser} />
          {/* <div css={detailStyle()} className="userinfo__detail">
                    <div css={thumbnailStyle()} className="detail__thumbnail">
                        {avatar}
                    </div>
                    <div css={userDetailStyle()} className="detail__user" dir={Translator.getDirection(this.props.lang)}>
                        <div css={userNameStyle()} className="user__name">
                            {this.state.loggedInUser.name}
                        </div>
                        <p css={userStatusStyle(this.props)} className="user__status">
                            {Translator.translate("ONLINE", this.props.lang)}
                        </p>
                    </div>
                </div> */}
          <div css={optionsStyle()} className="userinfo__options">
            <div css={optionTitleStyle(props)} className="options__title">
              {localize("PREFERENCES", props.lang)}
            </div>
            <div css={optionListStyle()} className="options_list">
              <div
                css={optionStyle(notificationIcon)}
                className="option option-notification"
              >
                <div css={optionNameStyle()} className="option_name">
                  {localize("NOTIFICATIONS", props.lang)}
                </div>
              </div>
              <div
                css={optionStyle(privacyIcon)}
                className="option option-privacy"
              >
                <div css={optionNameStyle()} className="option_name">
                  {localize("PRIVACY_AND_SECURITY", props.lang)}
                </div>
              </div>
              <div css={optionStyle(chatIcon)} className="option option-chats">
                <div css={optionNameStyle()} className="option_name">
                  {localize("CHATS", props.lang)}
                </div>
              </div>
            </div>
            <div css={optionTitleStyle(this.props)} className="options__title">
              {localize("OTHER", props.lang)}
            </div>
            <div css={optionListStyle()} className="options_list">
              <div css={optionStyle(helpIcon)} className="option option-help">
                <div css={optionNameStyle()} className="option_name">
                  {localize("HELP", props.lang)}
                </div>
              </div>
              <div
                css={optionStyle(reportIcon)}
                className="option option-report"
              >
                <div css={optionNameStyle()} className="option_name">
                  {localize("REPORT_PROBLEM", props.lang)}
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    }
  }, []);

  hooks(props, setLoggedInUser, setError);

  return (
    <div css={userInfoScreenStyle(props)} className="userinfo">
      {userProfile}
      <CometChatToastNotification ref={error} />
    </div>
  );
};

// Specifies the default values for props:
CometChatUserProfile.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
  title: Translator.translate("MORE", Translator.getDefaultLanguage()),
  titleFont: "bold 22px Inter",
  titleColor: "#141414",
  backgroundColor: "#ffffff",
};

CometChatUserProfile.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object,
  title: PropTypes.string,
  titleFont: PropTypes.string,
  titleColor: PropTypes.string,
  backgroundColor: PropTypes.string,
};

export { CometChatUserProfile };
