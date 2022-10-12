import { fontHelper } from "../../Shared";

export const emojiContainerStyle = (props, theme) => {
  return {
    padding: "0px",
    overflowY: "scroll",
    width: props.style.width,
    height: props.style.height,
    background:
      props?.style?.background ||
      theme?.palette?.background[theme?.palette?.mode],
    borderRadius: "12px",
  };
};

export const emojiListStyle = () => {
  return {
    display: "flex",
    flexWrap: "wrap",
  };
};

export const emojiCategoryWrapper = () => {
  return {
    justifyContent: "center",
    alignItems: "center",
  };
};

export const emojiCategoryTitle = (props, theme) => {
  let color = theme.palette.accent500[theme.palette.mode];
  let font = fontHelper(theme.typography.caption1);
  return {
    textAlign: "left",
    paddingLeft: "16px",
    paddingTop: "8px",
    font: props.style.sectionHeaderFont || font,
    color: props.style.sectionHeaderColor || color,
  };
};

export const emojiTabLsitStyle = (props, theme) => {
  return {
    width: props.style.width,
    zIndex: "3",
    display: "flex",
    flexWrap: "wrap",
    padding: "5px 2px",
    position: "sticky",
    bottom: "0px",
    alignItems: "center",
    justifyContent: "space-between",

    background:
      props?.style?.categoryBackground || theme?.palette?.getBackground(),
  };
};

/**Child props style */
export const getListStyle = (theme) => {
  return {
    iconWidth: "24px",
    iconHeight: "24px",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    iconTint: theme?.palette?.accent600[theme?.palette?.mode],
    background: "transparent",
  };
};

export const listStyle = (props, theme) => {
  let font = fontHelper(theme.typography.heading);
  return {
    padding: "3px",
    display: "flex",
    cursor: "pointer",
    borderRadius: "3px",
    alignItems: "center",
    justifyContent: "center",
    textFont: font,
    background: props.style?.background || theme?.palette?.getBackground(),
  };
};
