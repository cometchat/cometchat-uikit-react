/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';

import Avatar from "../Avatar";

import {
  listItem,
  listItemIcon,
  itemThumbnailStyle,
  itemDetailStyle,
  itemNameWrapperStyle,
  itemDescStyle,
  listItemName  
} from "./style";

import { theme } from "../../resources/theme";
import Translator from "../../resources/localization/translator";

import shieldIcon from "./resources/shield.png";
import lockIcon from "./resources/lock.png";

const groupview = (props) => {

  const toggleTooltip = (event, flag) => {

    const elem = event.target;

    const scrollWidth = elem.scrollWidth;
    const clientWidth = elem.clientWidth;

    if(scrollWidth <= clientWidth) {
      return false;
    }

    if(flag) {
      elem.setAttribute("title", elem.textContent);
    } else {
      elem.removeAttribute("title");
    }
  } 

  let groupTypeIcon = null;
  if(props.group.type === "private") {

    groupTypeIcon = (<img src={shieldIcon} alt={Translator.translate("PRIVATE_GROUP", props.lang)} />);

  } else if(props.group.type === "password") {

    groupTypeIcon = (<img src={lockIcon} alt={Translator.translate("PROTECTED_GROUP", props.lang)} />);
  }

  return (
    <div css={listItem(props)} className="list__item" onClick={() => props.clickHandler(props.group)}>
      <div css={itemThumbnailStyle()} className="list__item__thumbnail">
        <Avatar image={props.group.icon} borderColor={props.theme.borderColor.primary} />
      </div>
      <div css={itemDetailStyle()} className="list__item__details" dir={Translator.getDirection(props.lang)}>
        <div css={itemNameWrapperStyle()} className="item__details__name"
        onMouseEnter={event => toggleTooltip(event, true)} 
        onMouseLeave={event => toggleTooltip(event, false)}> 
          <p css={listItemName()}>{props.group.name}</p>
          <div css={listItemIcon()}>{groupTypeIcon}</div>
        </div>
        <div css={itemDescStyle(props)} className="item__details__desc">{`${props.group.membersCount} ${Translator.translate("MEMBERS", props.lang).toLowerCase()}`}</div>
      </div>
    </div>
  )
}

// Specifies the default values for props:
groupview.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

groupview.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default groupview;