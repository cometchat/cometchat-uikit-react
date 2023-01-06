import React from "react";
import PropTypes from "prop-types";
import moreIcon from "./resources/more.svg";
import {
  menuActionStyle,
  actionWrapperStyle,
  toggleStyle,
  listItemStyle,
} from "./style";

import { CometChatListItem, localize } from "../../../Shared";

const CometChatMenuList = (props) => {
  const [toggle, setToggle] = React.useState(false);

  const handleToggle = () => setToggle(!toggle);
  const callback = (onClickFunc, event) => {
    onClickFunc(props.data, event);
  };

  const getMenuPane = () => {
    return toggle ? (
      <div style={toggleStyle(props)} className="menu__list">
        {props?.list?.slice(props.mainMenuLimit).map((ele) => (
          <CometChatListItem
            key={ele.id}
            type="button"
            className="list__item"
            id={ele.id}
            style={listItemStyle(props)}
            text={ele.title}
            hoverText={ele.title}
            onClick={callback.bind(this, ele.onClick)}
            onItemClick={callback.bind(this, ele.onClick)}
          />
        ))}
      </div>
    ) : null;
  };

  const getMenuList = () => {
    return (
      <React.Fragment>
        {props?.list?.slice(0, props?.mainMenuLimit).map((ele) => (
          <CometChatListItem
            key={ele.id}
            className="list__item"
            id={ele.id}
            iconURL={ele.iconURL}
            hoverText={ele.title}
            onClick={callback.bind(this, ele.onClick)}
            onItemClick={callback.bind(this, ele.onClick)}
            style={menuActionStyle(props)}
          />
        ))}
        {props.list.length > props.mainMenuLimit && (
          <React.Fragment>
            <CometChatListItem
              type="button"
              style={menuActionStyle(props)}
              className="list__item"
              iconURL={moreIcon}
              hoverText={localize("MORE")}
              onItemClick={handleToggle.bind(this)}
            />
            {getMenuPane()}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };

  return (
    <div style={actionWrapperStyle(props)} className="menu__list">
      {getMenuList()}
    </div>
  );
};

CometChatMenuList.defaultProps = {
  moreIconURL: moreIcon,
  mainMenuLimit: 3,
  data: {},
  subMenuStyle: {
    width: "",
    height: "",
    border: "",
    borderRadius: "",
    background: "",
    moreIconTint: "",
  },
  list: [],
  isOpen: false,
  style: {},
};

CometChatMenuList.propTypes = {
  moreIconURL: PropTypes.string,
  mainMenuLimit: PropTypes.number,
  data: PropTypes.object,
  isOpen: PropTypes.bool,
  list: PropTypes.array,
  subMenuStyle: PropTypes.object,
  style: PropTypes.object,
};

export { CometChatMenuList };
