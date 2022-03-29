import { CometChatLocalize } from "../..";

export const listBaseStyle = (props) => {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "16px 0",
    width: props.style.width,
    height: props.style.height,
    background: props.style.background,
    borderRadius: props.style.cornerRadius,
    border: props.style.border,
  };
};

export const listBaseHeadStyle = (props) => {
  const height = !props.hideSearch
    ? {
        height: "101px",
      }
    : {
        height: "40px",
      };

  return {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: props.style.width,
    ...height,
  };
};

export const listBaseNavStyle = (props) => {
  return {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: props.style.height,
    width: props.style.width,
    padding: "0 16px",
  };
};

export const backButtonStyle = (props) => {
  return {
    WebkitMask: `url(${props.backButtonIconURL}) no-repeat left center`,
    backgroundColor: `${props.style.backIconTint}`,
    height: "24px",
    width: "24px",
    cursor: "pointer",
    visibility: "hidden",
  };
};

export const listBaseTitleStyle = (props) => {
  return {
    font: props.style.titleFont,
    color: props.style.titleColor,
    lineHeight: "26px",
    width: props.style.width,
  };
};

export const listBaseSearchStyle = (props) => {
  return {
    // boxShadow: `${props.style.searchBackground} 0 0 0 1px inset`,
    background: props.style.searchBackground,
    font: props.style.searchTextFont,
    cursor: "pointer",
    color: props.style.searchTextColor,
    lineHeight: "20px",
    height: "50px",
    width: "calc(100% - 30px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "16px",
    paddingLeft: "8px",
    borderRadius: props.style.searchCornerRadius,
    border: props.style.searchBorder,
  };
};

export const listBaseSearchButtonStyle = (props) => {
  return {
    WebkitMask: `url(${props.searchIconURL}) no-repeat left center`,
    background: props.style.searchIconTint,
    border: "none",
    borderRadius: props.style.searchCornerRadius,
    width: "24px",
    padding: "8px 0 8px 8px",
    cursor: "default",
  };
};

export const listBaseSearchInputStyle = (props) => {
  const padding = CometChatLocalize.isRTL()
    ? { padding: "8px 0 8px 8px" }
    : { padding: "8px 8px 8px 0" };
  return {
    width: "calc(100% - 35px)",
    outline: "none",
    height: props.style.height,
    font: props.style.searchTextFont,
    color: props.style.searchTextColor,
    background: "transparent",
    border: "white",
    padding: "8px 0 8px 0px",
  };
};

export const listBaseContainerStyle = (props) => {
  const height = !props.hideSearch
    ? {
        height: "calc(100% - 101px)",
      }
    : {
        height: "calc(100% - 50px)",
      };

  return {
    background: "inherit",
    width: props.style.width,
    ...height,
  };
};
