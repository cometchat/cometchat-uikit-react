import * as React from "react";
import PropTypes from "prop-types";

import { CometChatListItem, localize, CometChatTheme } from "../..";

import { layoutType } from "./layoutType";
import { Hooks } from "./hooks";
import {
  actionSheetWrapperStyle,
  actionSheetHeaderStyle,
  actionSheetTitleStyle,
  actionSheetLayoutIconStyle,
  sheetItemListStyle,
  listItemStyle,
} from "./style";

import toggleLayoutIcon from "./resources/file-upload.svg";

const CometChatActionSheet = (props) => {
  const [actionList, setActionList] = React.useState([]);
  const [mode, setMode] = React.useState(props.layoutMode);
  const [theme] = React.useState(new CometChatTheme(props.theme || {}));

  const toggleLayoutMode = () => {
    const newMode =
      mode === layoutType.list ? layoutType.grid : layoutType.list;
    setMode(newMode);
  };

  let renderKey = null;
  const renderItems = actionList.map((action, index) => {
    return (
      <CometChatListItem
        key={action?.type}
        iconURL={action?.icon}
        text={action?.name}
        style={listItemStyle(props, mode, index, theme)}
        onItemClick={action.onActionClick}
      />
    );
  });

  const toggleLayoutButton = !props.hideLayoutMode ? (
    <div
      className="sheet__layout"
      style={actionSheetLayoutIconStyle(props, mode)}
      onClick={toggleLayoutMode.bind(this)}
    ></div>
  ) : null;

  Hooks(props, setActionList);

  return (
    <div className="action__sheet" style={actionSheetWrapperStyle(props, mode)}>
      <div
        key={renderKey}
        className="sheet__header"
        style={actionSheetHeaderStyle(props)}
      >
        <div className="sheet__title" style={actionSheetTitleStyle(props)}>
          {props.title}
        </div>
        {toggleLayoutButton}
      </div>
      <div className="sheet__items" style={sheetItemListStyle(props)}>
        {renderItems}
      </div>
    </div>
  );
};

CometChatActionSheet.defaultProps = {
  title: localize("ADD_TO_CHAT"),
  layoutModeIconURL: toggleLayoutIcon,
  layoutMode: layoutType["list"],
  hideLayoutMode: false,
  actions: [],
  style: {
    layoutModeIconTint: "rgba(20, 20, 20, 0.04)",
    borderRadius: "8px",
    background: "rgb(255,255,255)",
    border: "0 none",
    width: "272px",
    height: "236px",
    titleFont: "15px 600 Inter, sans-serif",
    titleColor: "#141414",
  },
};

CometChatActionSheet.propTypes = {
  title: PropTypes.string,
  layoutMode: PropTypes.oneOf(["list", "grid"]),
  hideLayoutMode: PropTypes.bool,
  layoutModeIconURL: PropTypes.string,
  style: PropTypes.object,
  actions: PropTypes.array,
};

export { CometChatActionSheet };
