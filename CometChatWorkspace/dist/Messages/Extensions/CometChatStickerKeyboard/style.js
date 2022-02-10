"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stickerWrapperStyle = exports.stickerSectionListStyle = exports.stickerMsgTxtStyle = exports.stickerMsgStyle = exports.stickerListStyle = exports.stickerItemStyle = exports.stickerCloseStyle = exports.sectionListItemStyle = void 0;

var stickerWrapperStyle = function stickerWrapperStyle(context) {
  // const slideAnimation = keyframes`
  // from {
  //     bottom: -55px
  // }
  // to {
  //     bottom: 0px
  // }`;
  return {
    backgroundColor: "grey",
    border: "1px solid #141414",
    borderBottom: "none",
    //animation: `${slideAnimation} 0.5s ease-out`,
    borderRadius: "10px 10px 0 0",
    height: "215px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  };
};

exports.stickerWrapperStyle = stickerWrapperStyle;

var stickerSectionListStyle = function stickerSectionListStyle(context) {
  return {
    borderTop: "1px solid #141414",
    backgroundColor: "grey",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    textTransform: "uppercase",
    overflowX: "auto",
    overflowY: "hidden",
    padding: "10px",
    "::-webkit-scrollbar": {
      background: "#141414"
    },
    "::-webkit-scrollbar-thumb": {
      background: "grey"
    }
  };
};

exports.stickerSectionListStyle = stickerSectionListStyle;

var sectionListItemStyle = function sectionListItemStyle() {
  return {
    height: "35px",
    width: "35px",
    cursor: "pointer",
    flexShrink: "0",
    ":not(:first-of-type)": {
      marginLeft: "16px"
    }
  };
};

exports.sectionListItemStyle = sectionListItemStyle;

var stickerListStyle = function stickerListStyle() {
  return {
    height: "calc(100% - 50px)",
    display: "flex",
    overflowX: "hidden",
    overflowY: "auto",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center"
  };
};

exports.stickerListStyle = stickerListStyle;

var stickerItemStyle = function stickerItemStyle(context) {
  //const mq = [...context.theme.breakPoints];
  return {
    minWidth: "50px",
    minHeight: "50px",
    maxWidth: "70px",
    maxHeight: "70px",
    cursor: "pointer",
    flexShrink: "0",
    marginRight: "20px" //[`@media ${mq[1]}, ${mq[2]}, ${mq[3]}`]: {
    //	maxWidth: "70px",
    //	maxHeight: "70px",
    //},

  };
};

exports.stickerItemStyle = stickerItemStyle;

var stickerMsgStyle = function stickerMsgStyle() {
  return {
    overflow: "hidden",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: "35%"
  };
};

exports.stickerMsgStyle = stickerMsgStyle;

var stickerMsgTxtStyle = function stickerMsgTxtStyle() {
  return {
    margin: "0",
    height: "30px",
    color: "#141414",
    fontSize: "24px!important",
    fontWeight: "600"
  };
};

exports.stickerMsgTxtStyle = stickerMsgTxtStyle;

var stickerCloseStyle = function stickerCloseStyle(img) {
  return {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    alignSelf: "flex-end",
    mask: "url(".concat(img, ") center center no-repeat"),
    backgroundColor: "#39f",
    cursor: "pointer",
    margin: "8px 8px 0 0"
  };
};

exports.stickerCloseStyle = stickerCloseStyle;