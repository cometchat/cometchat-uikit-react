import { fontHelper } from "../../Shared";

export const stickerWrapperStyle = (props, theme) => {
  return {
    height: props.style.height,
    width: props.style.width,
    border: props.style.border,
    borderRadius: props.style.borderRadius,
    background:
      props?.style?.background || theme.palette.background[theme.palette.mode],
    justifyContent: "center",
    position: "absolute",
    bottom: "90px",
    right: "8px",
  };
};

export const stickerSectionListStyle = (props, theme) => {
  return {
    display: "flex",
    overflowX: "auto",
    alignItems: "center",
    justifyContent: "space-between",
    background:
      props?.style?.categoryBackground ||
      theme.palette.accent50[theme.palette.mode],
    borderRadius: props.style.borderRadius,
    paddingLeft: "24px",
  };
};

export const sectionListItemStyle = () => {
  return {
    height: "35px",
    width: "35px",
    cursor: "pointer",
    flexShrink: "0",
    padding: "8px 0px",
  };
};

export const stickerListStyle = () => {
  return {
    height: "100%",
    display: "flex",
    overflowX: "hidden",
    overflowY: "auto",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  };
};

export const stickerItemStyle = () => {
  return {
    minWidth: "50px",
    minHeight: "50px",
    maxWidth: "70px",
    maxHeight: "70px",
    cursor: "pointer",
    flexShrink: "0",
    margin: "8px",
  };
};

export const stickerMsgStyle = () => {
  return {
    overflow: "hidden",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    top: "45%",
  };
};

export const stickerMsgTxtStyle = (props, theme) => {
  return {
    margin: "0",
    height: "30px",
    color:
      props?.style?.emptyTextColor ||
      theme.palette.accent600[theme.palette.mode],
    font: props.style.emptyTextFont || fontHelper(theme.typography.title1),
  };
};

export const stickerImageStyle = () => {
  return {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };
};

export const stickerCategoryImageStyle = () => {
  return {
    width: "24px",
    height: "24px",
    objectFit: "cover",
  };
};
