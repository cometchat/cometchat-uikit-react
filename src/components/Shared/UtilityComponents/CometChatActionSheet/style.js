import { layoutType } from "./layoutType";
import { fontHelper } from "../../../Shared";

export const actionSheetWrapperStyle = (props) => {
  return {
    background: "transparent",
    borderRadius: props.style.borderRadius,
    border: props.style.border,
    width: props.style.width,
    height: "auto",
    transform: "scale(1)",
    transformOrigin: "left bottom",
    overflowY: "auto",
    overflowX: "hidden",
    display: "flex",
    padding: "8px",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    ...props.style,
    boxSizing: "border-box",
  };
};

export const actionSheetHeaderStyle = () => {
  return {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    marginBottom: "10px",
  };
};

export const actionSheetTitleStyle = (props) => {
  return {
    font: props.style.titleFont,
    color: props.style.titleColor,
    lineHeight: "22px",
    width: "calc(100% - 24px)",
  };
};

export const actionSheetLayoutIconStyle = (props, mode) => {
  return {
    WebkitMask: `url(${props.layoutModeIconURL}) no-repeat center center`,
    background: "rgb(51,153,255)",
    height: "24px",
    width: "24px",
    cursor: "pointer",
  };
};

export const sheetItemListStyle = (props) => {
  return {
    width: "100%",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    overflowY: "auto",
    overflowX: "hidden",
    flexDirection: "row",
    flexWrap: "wrap",
    boxSizing: "border-box",
  };
};

export const listItemStyle = (props, mode, index, theme) => {
  let height = "auto",
    width = "100%",
    cornerRadius = "10px",
    borderBottom = {},
    sheetItemStyle = {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      margin: "0",
      cursor: "pointer",
      padding: "8px 16px",
      overflow: "hidden",
      boxSizing: "border-box",
    };

  if (mode === layoutType.grid) {
    width = "122px";
    height = "100px";
    sheetItemStyle = {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      margin: "4px 4px",
      borderRadius: "10px",
      textAlign: "center",
      flexWrap: "wrap",
      cursor: "pointer",
    };
  }

  if (mode === layoutType.list) {
    let borderRadius = { borderRadius: "0" };
    let borderBottom = {
      borderBottom: `1px solid ${theme.palette.accent100[theme.palette.mode]}`,
    };

    if (index === 0) {
      borderRadius = { borderRadius: "10px 10px 0 0" };
    } else if (index === props.actions.length - 1) {
      borderRadius = { borderRadius: "0 0 10px 10px" };
      borderBottom = { borderBottom: "0 none" };
    }
    sheetItemStyle = {
      ...sheetItemStyle,
      ...borderRadius,
      ...borderBottom,
      margin: "0 5px",
    };
  }

  return {
    iconTint: "#6929CA",
    background: theme.palette.accent100[theme.palette.mode],
    textFont: fontHelper(theme.typography.subtitle2),
    textColor: theme?.palette?.accent[theme.palette.mode],
    width: width,
    height: height,
    iconWidth: "24px",
    iconHeight: "24px",
    ...sheetItemStyle,
  };
};
