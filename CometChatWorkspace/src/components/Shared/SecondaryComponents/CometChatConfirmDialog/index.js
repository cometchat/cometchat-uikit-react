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
    buttonCancelStyle
} from "./style";

import loadingIcon from "./resources/loading.svg";

const CometChatConfirmDialog = props => {

    const [state, setState] = React.useState("initial");
    const confirmButtonText = props.confirmButtonText;
    const cancelButtonText = props.cancelButtonText;

    const onConfirm = event => {

        setState("loading");
        props.onConfirm(event)
        .then(response => {
            setState("done");
        }).catch(error => {
            console.log("error", error)
            setState("error");
        });
    }

    return (
        <div className="confirm__dialog" style={dialogWrapperStyle(props, state)}>
            <div style={dialogLoadingWrapperStyle(props, state)} className="dialog__loading__wrapper">
                <div style={dialogLoadingStyle(props, state, loadingIcon)} className="dialog__loading"></div>
            </div>
            <div className="dialog__form" style={dialogFormStyle(props, state)}>
                <div className="dialog__error" style={dialogErrorStyle(props, state)}>
                    Something went wrong!
                </div>
                <div className="dialog__message" style={dialogMessageStyle(props)}>
                    {props.messageText}
                </div>
                <div className="dialog__buttons" style={dialogButtonStyle(props)}>
                    <button type="button" className="button__confirm" style={buttonCancelStyle(props)} onClick={props.onCancel}>
                        {cancelButtonText}
                    </button>
                    <button type="button" className="button__cancel" style={buttonConfirmStyle(props)} onClick={onConfirm}>
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
}

CometChatConfirmDialog.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	confirmButtonText: PropTypes.string.isRequired,
	cancelButtonText: PropTypes.string.isRequired,
	messageText: PropTypes.string.isRequired,
	onConfirm: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
    background: PropTypes.string,
    width: PropTypes.string,
    height: PropTypes.string
};

CometChatConfirmDialog.defaultProps = {
	isOpen: false,
	confirmButtonText: "Yes",
	cancelButtonText: "No",
	messageText: "Are you sure?",
	onConfirm: () => {},
	onCancel: () => {},
	background: "white",
	width: "100%",
    height: "100%"
};

export {CometChatConfirmDialog};