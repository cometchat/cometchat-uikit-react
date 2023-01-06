import { fontHelper } from "../../Shared";
export const previewWrapperStyle = (style, theme) => {
  return {
    padding: "8px 8px 16px 8px",
    width: "100%",
    marginBottom: "-8px",
    background:
      style.background || theme?.palette?.background[theme?.palette?.mode],
    fontSize: "13px",
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "flex-end",
    alignItems: "center",
    position: "absolute",
    bottom: "0px",
    zIndex: "2",
  };
};

export const previewHeadingStyle = () => {
  return {
    alignSelf: "flex-start",
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
  };
};

export const previewCloseStyle = (style, img, theme) => {
  return {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    padding: "25px",
    WebkitMask: `url(${img}) center center no-repeat`,
    background:
      style.closeIconTint || theme?.palette?.accent600[theme?.palette?.mode],
    cursor: "pointer",
  };
};

export const previewOptionsWrapperStyle = () => {
  return {
    display: "flex",
    alignItems: "center",
    width: "fit-content",
  };
};

export const previewOptionStyle = (style, theme) => {
  return {
    padding: "5px",
    margin: "0 4px",
    boxShadow: style.boxShadow || "0px 0px 0px 1px #f2eeee",
    background:
      style.textBackground || theme?.palette?.background[theme?.palette?.mode],
    border: `1px solid #eaeaea`,
    textFont: style.textFont || fontHelper(theme?.typography?.subtitle2),
    textColor: style.textColor || theme?.palette?.accent[theme?.palette?.mode],
    borderRadius: "18px",
    cursor: "pointer",
    textAlign: "center",
  };
};
