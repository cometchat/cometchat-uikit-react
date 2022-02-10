"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tableFootStyle = exports.tableCaptionStyle = exports.tableBodyStyle = exports.modalWrapperStyle = exports.modalTableStyle = exports.modalErrorStyle = exports.modalCloseStyle = exports.modalBodyStyle = exports.iconWrapperStyle = exports.addOptionIconStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _ = require("../../");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var modalWrapperStyle = function modalWrapperStyle() {
  var mq = (0, _toConsumableArray2.default)(_.BREAKPOINTS);
  return (0, _defineProperty2.default)({
    minWidth: "350px",
    minHeight: "450px",
    width: "50%",
    height: "40%",
    overflow: "hidden",
    backgroundColor: "#fff",
    position: "fixed",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: "1002",
    margin: "0 auto",
    boxShadow: "rgba(20, 20, 20, 0.2) 0 16px 32px, rgba(20, 20, 20, 0.04) 0 0 0 1px",
    borderRadius: "12px",
    display: "block"
  }, "@media ".concat(mq[1], ", ").concat(mq[2]), {
    width: "100%",
    height: "100%"
  });
};

exports.modalWrapperStyle = modalWrapperStyle;

var modalCloseStyle = function modalCloseStyle(img, context) {
  return {
    position: "absolute",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    top: "16px",
    right: "16px",
    mask: "url(".concat(img, ") center center no-repeat"),
    backgroundColor: "#39f",
    cursor: "pointer"
  };
};

exports.modalCloseStyle = modalCloseStyle;

var modalBodyStyle = function modalBodyStyle() {
  return {
    padding: "24px",
    height: "100%",
    width: "100%"
  };
};

exports.modalBodyStyle = modalBodyStyle;

var modalErrorStyle = function modalErrorStyle() {
  return {
    fontSize: "12px",
    color: "red",
    textAlign: "center",
    margin: "8px 0",
    width: "100%"
  };
};

exports.modalErrorStyle = modalErrorStyle;

var modalTableStyle = function modalTableStyle() {
  return {
    borderCollapse: "collapse",
    margin: "0",
    padding: "0",
    width: "100%",
    height: "90%",
    tr: {
      borderBottom: "1px solid #39f",
      display: "table",
      width: "100%",
      tableLayout: "fixed"
    }
  };
};

exports.modalTableStyle = modalTableStyle;

var tableCaptionStyle = function tableCaptionStyle() {
  return {
    fontSize: "20px",
    marginBottom: "15px",
    fontWeight: "bold",
    textAlign: "left"
  };
};

exports.tableCaptionStyle = tableCaptionStyle;

var tableBodyStyle = function tableBodyStyle() {
  return {
    height: "calc(100% - 40px)",
    overflowY: "auto",
    display: "block",
    "tr": {
      "td": {
        padding: "8px 16px",
        fontSize: "14px",
        "input": {
          width: "100%",
          border: "none",
          padding: "8px 16px",
          fontSize: "14px",
          "&:focus": {
            outline: "none"
          }
        },
        "label": {
          padding: "8px 16px"
        },
        ":first-of-type": {
          width: "120px"
        }
      }
    }
  };
};

exports.tableBodyStyle = tableBodyStyle;

var tableFootStyle = function tableFootStyle(state, img) {
  var loadingState = {};
  var textMargin = {};

  if (state.creatingPoll) {
    loadingState = {
      disabled: "true",
      pointerEvents: "none",
      background: "url(".concat(img, ") no-repeat right 10px center #39f")
    };
    textMargin = {
      marginRight: "24px"
    };
  }

  return {
    display: "inline-block",
    tr: {
      border: "none",
      td: {
        textAlign: "center",
        button: _objectSpread(_objectSpread({
          cursor: "pointer",
          padding: "8px 16px",
          backgroundColor: "#39f",
          borderRadius: "5px",
          color: "#fff",
          fontSize: "14px",
          outline: "0",
          border: "0"
        }, loadingState), {}, {
          span: _objectSpread({}, textMargin)
        })
      }
    }
  };
};

exports.tableFootStyle = tableFootStyle;

var iconWrapperStyle = function iconWrapperStyle() {
  return {
    width: "50px"
  };
};

exports.iconWrapperStyle = iconWrapperStyle;

var addOptionIconStyle = function addOptionIconStyle(img) {
  return {
    backgroundSize: "28px 28px",
    cursor: "pointer",
    display: "block",
    height: "24px",
    width: "24px",
    mask: "url(".concat(img, ") center center no-repeat"),
    backgroundColor: "rgb(128, 128, 128)"
  };
};

exports.addOptionIconStyle = addOptionIconStyle;