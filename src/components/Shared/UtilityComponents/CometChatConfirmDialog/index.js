import React from "react";
import PropTypes from "prop-types";

import {
  dialogLoadingWrapperStyle,
  dialogLoadingStyle,
  dialogWrapperStyle,
  dialogFormStyle,
  dialogErrorStyle,
  dialogMessageStyle,
  dialogButtonStyle,
  buttonConfirmStyle,
  buttonCancelStyle,
  dialogTitleStyle,
} from "./style";

import loadingIcon from "./resources/loading.svg";
import { localize } from "../../PrimaryComponents";

const CometChatConfirmDialog = (props) => {
  const [state, setState] = React.useState("initial");
  const confirmButtonText = props.confirmButtonText;
  const cancelButtonText = props.cancelButtonText;

  const onConfirm = (event) => {
    setState("loading");
    props
      .onConfirm(event)
      .then((response) => {
        setState("done");
      })
      .catch((error) => {
        setState("error");
      });
  };

  return (
    <div className="confirm__dialog" style={dialogWrapperStyle(props)}>
      <div
        style={dialogLoadingWrapperStyle(props, state)}
        className="dialog__loading__wrapper"
      >
        <div
          style={dialogLoadingStyle(loadingIcon)}
          className="dialog__loading"
        ></div>
      </div>
      <div className="dialog__form" style={dialogFormStyle(props, state)}>
        <div className="dialog__error" style={dialogErrorStyle(props, state)}>
          {localize("SOMETHING_WRONG")}
        </div>
        <div className="dialog__title" style={dialogTitleStyle(props)}>
          {props.title}
        </div>
        <div className="dialog__message" style={dialogMessageStyle(props)}>
          {props.messageText}
        </div>
        <div className="dialog__buttons" style={dialogButtonStyle(props)}>
          <button
            type="button"
            className="button__cancel"
            style={buttonConfirmStyle(props)}
            onClick={onConfirm}
          >
            {confirmButtonText}
          </button>

          <button
            type="button"
            className="button__confirm"
            style={buttonCancelStyle(props)}
            onClick={props.onCancel}
          >
            {cancelButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

CometChatConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  confirmButtonText: PropTypes.string.isRequired,
  cancelButtonText: PropTypes.string.isRequired,
  messageText: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  style: PropTypes.object.isRequired,
};

CometChatConfirmDialog.defaultProps = {
  isOpen: false,
  title: "",
  messageText: "Are you sure?",
  confirmButtonText: "Delete",
  cancelButtonText: "Cancel",
  onConfirm: () => { },
  onCancel: () => { },
  style: {
    confirmButtonTextFont: "",
    confirmButtonTextColor: "",
    cancelButtonTextFont: "",
    cancelButtonTextColor: "",
    messageTextFont: "",
    messageTextColor: "",
    cancelBackground: "",
    confirmBackground: "",
  },
};
export { CometChatConfirmDialog };
