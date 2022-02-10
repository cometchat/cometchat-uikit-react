"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatConfirmDialog = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _style = require("./style");

var _loading = _interopRequireDefault(require("./resources/loading.svg"));

var CometChatConfirmDialog = function CometChatConfirmDialog(props) {
  var _React$useState = _react.default.useState("initial"),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      state = _React$useState2[0],
      setState = _React$useState2[1];

  var confirmButtonText = props.confirmButtonText;
  var cancelButtonText = props.cancelButtonText;

  var onConfirm = function onConfirm(event) {
    setState("loading");
    props.onConfirm(event).then(function (response) {
      setState("done");
    }).catch(function (error) {
      console.log("error", error);
      setState("error");
    });
  };

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.dialogBackdropStyle)(props),
    className: "confirm__dialog__backdrop"
  }), /*#__PURE__*/_react.default.createElement("div", {
    className: "confirm__dialog",
    style: (0, _style.dialogWrapperStyle)(props, state)
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.dialogLoadingWrapperStyle)(props, state),
    className: "dialog__loading__wrapper"
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.dialogLoadingStyle)(props, state, _loading.default),
    className: "dialog__loading"
  })), /*#__PURE__*/_react.default.createElement("div", {
    className: "dialog__form",
    style: (0, _style.dialogFormStyle)(props, state)
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "dialog__error",
    style: (0, _style.dialogErrorStyle)(props, state)
  }, "Something went wrong!"), /*#__PURE__*/_react.default.createElement("div", {
    className: "dialog__message",
    style: (0, _style.dialogMessageStyle)(props)
  }, props.messageText), /*#__PURE__*/_react.default.createElement("div", {
    className: "dialog__buttons",
    style: (0, _style.dialogButtonStyle)(props)
  }, /*#__PURE__*/_react.default.createElement("button", {
    type: "button",
    className: "button__confirm",
    style: (0, _style.buttonCancelStyle)(props),
    onClick: props.onCancel
  }, cancelButtonText), /*#__PURE__*/_react.default.createElement("button", {
    type: "button",
    className: "button__cancel",
    style: (0, _style.buttonConfirmStyle)(props),
    onClick: onConfirm
  }, confirmButtonText)))));
};

exports.CometChatConfirmDialog = CometChatConfirmDialog;
CometChatConfirmDialog.propTypes = {
  isOpen: _propTypes.default.bool.isRequired,
  confirmButtonText: _propTypes.default.string.isRequired,
  cancelButtonText: _propTypes.default.string.isRequired,
  messageText: _propTypes.default.string.isRequired,
  onConfirm: _propTypes.default.func.isRequired,
  onCancel: _propTypes.default.func.isRequired,
  background: _propTypes.default.string,
  width: _propTypes.default.string,
  height: _propTypes.default.string
};
CometChatConfirmDialog.defaultProps = {
  isOpen: false,
  confirmButtonText: "Yes",
  cancelButtonText: "No",
  messageText: "Are you sure?",
  onConfirm: function onConfirm() {},
  onCancel: function onCancel() {},
  background: "white",
  width: "100%",
  height: "100%"
};