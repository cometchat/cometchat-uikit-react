import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatAvatar } from "../../Shared";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
  listItem,
  listItemIcon,
  itemThumbnailStyle,
  itemDetailStyle,
  itemNameWrapperStyle,
  itemDescStyle,
  listItemName  
} from "./style";

import shieldIcon from "./resources/shield.png";
import lockIcon from "./resources/lock.png";

class CometChatGroupListItem extends React.PureComponent {

  toggleTooltip = (event, flag) => {

    const elem = event.target;

    const scrollWidth = elem.scrollWidth;
    const clientWidth = elem.clientWidth;

    if (scrollWidth <= clientWidth) {
      return false;
    }

    if (flag) {
      elem.setAttribute("title", elem.textContent);
    } else {
      elem.removeAttribute("title");
    }
  }

  render() {

    let groupTypeIcon = null;
    if (this.props.group.type === "private") {

      groupTypeIcon = (<img src={shieldIcon} alt={Translator.translate("PRIVATE_GROUP", this.props.lang)} />);

    } else if (this.props.group.type === "password") {

      groupTypeIcon = (<img src={lockIcon} alt={Translator.translate("PROTECTED_GROUP", this.props.lang)} />);
    }

    return (
      <div css={listItem(this.props)} className="list__item" onClick={() => this.props.clickHandler(this.props.group)}>
        <div css={itemThumbnailStyle()} className="list__item__thumbnail">
          <CometChatAvatar group={this.props.group} />
        </div>
        <div css={itemDetailStyle()} className="list__item__details" dir={Translator.getDirection(this.props.lang)}>
          <div css={itemNameWrapperStyle()} className="item__details__name"
            onMouseEnter={event => this.toggleTooltip(event, true)}
            onMouseLeave={event => this.toggleTooltip(event, false)}>
            <p css={listItemName()}>{this.props.group.name}</p>
            <div css={listItemIcon()}>{groupTypeIcon}</div>
          </div>
          <div css={itemDescStyle(this.props)} className="item__details__desc">{`${this.props.group.membersCount} ${Translator.translate("MEMBERS", this.props.lang)}`}</div>
        </div>
      </div>
    );
  }
}

// Specifies the default values for props:
CometChatGroupListItem.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
  group: {},
  selectedGroup: {},
  clickHandler: () => { }
};

CometChatGroupListItem.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object,
  selectedGroup: PropTypes.oneOfType([PropTypes.object, PropTypes.shape(CometChat.Group)]),
  group: PropTypes.oneOfType([PropTypes.object, PropTypes.shape(CometChat.Group)]),
  clickHandler: PropTypes.func
}

export default CometChatGroupListItem;