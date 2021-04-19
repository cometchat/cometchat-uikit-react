import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";
import PropTypes from "prop-types";

import Translator from "../../../resources/localization/translator";

import {
    notificationContainerStyle,
    notificationStyle,
    notificationIconStyle,
    notificationMessageContainerStyle,
    notificationMessageStyle,
    notificationCloseButtonStyle
} from "./style";

import closeIcon from "./resources/toast_close.png";
import successIcon from "./resources/toast_success.png";
import errorIcon from "./resources/toast_error.png";
import infoIcon from "./resources/toast_info.png";
import warningIcon from "./resources/toast_warning.png";

export class CometChatToastNotification extends React.Component {

    interval;
    static types = {
        "INFO": "info",
        "WARNING": "warning",
        "SUCCESS": "success",
        "ERROR": "error",
    }

    constructor(props) {

        super(props);

        this._isMounted = false;
        this.state = { 
            type: "",
            message: ""
        };
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount = () => {

        this._isMounted = false;
        this.clearAutoDismiss();
    }

    setInfo = (message) => {

        if (this._isMounted) {

            this.setState({ type: "INFO", message: message, icon: infoIcon });
            this.setAutoDismiss();
        }
    }

    setError = (message) => {
        
        if (this._isMounted) {

            this.setState({ type: "ERROR", message: message, icon: errorIcon });
            //this.setAutoDismiss();
        }
    }

    setSuccess = (message) => {

        if (this._isMounted) {

            this.setState({ type: "SUCCESS", message: message, icon: successIcon });
            this.setAutoDismiss();
        }
    }

    setWarning = (message) => {

        if (this._isMounted) {

            this.setState({ type: "WARNING", message: message, icon: warningIcon });
            this.setAutoDismiss();
        }
    }

    setAutoDismiss = () => {

        this.clearAutoDismiss();
        
        if (this.props.autoDelete) {
            this.interval = setTimeout(() => this.deleteToast(), this.props.dismissTime);
        }
    }

    clearAutoDismiss = () => {
        clearTimeout(this.interval);
    }

    deleteToast = () => {
        this.setState({ type: "", message: "", icon: "" });
    }

    render() {

        if (!this.state.type.trim().length || !this.state.message.trim().length) {
            return null;
        }

        const messageClassName = `toast__message message-${CometChatToastNotification.types[this.state.type]}`;
        const iconClassName = `toast__icon icon-${CometChatToastNotification.types[this.state.type]}`;
        let toastIcon = (this.state.icon.trim().length) ? (

            <div css={notificationIconStyle()} className={iconClassName}>
                <img src={this.state.icon} alt="" />
            </div>
        ) : null;

        return (
            <div css={notificationContainerStyle(this.props, keyframes)} className="toast__notification">
                <div css={notificationStyle(this.props, this.state, keyframes, CometChatToastNotification)} className="toast__container">
                    {toastIcon}
                    <div css={notificationMessageContainerStyle()} className={messageClassName}>
                        <p css={notificationMessageStyle()}>{Translator.translate(this.state.message, this.props.lang)}</p>
                    </div>
                    <button css={notificationCloseButtonStyle()} type="button" onClick={this.deleteToast} className="toast__close">
                        <img src={closeIcon} alt={Translator.translate("CLOSE", this.props.lang)} />
                    </button>
                </div>
            </div>
        );
    }
}

CometChatToastNotification.defaultProps = {
    type: "",
    message: "",
    icon: "",
    position: "top-right",
    autoDelete: true,
    dismissTime: 3000,
    lang: Translator.getDefaultLanguage(),
}

CometChatToastNotification.propTypes = {
    type: PropTypes.oneOf(Object.values(CometChatToastNotification.types).concat("")),
    message: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    position: PropTypes.oneOf(["top-right", "bottom-right", "top-left", "bottom-left"]),
    autoDelete: PropTypes.bool,
    dismissTime: PropTypes.number,
    lang: PropTypes.string,
}