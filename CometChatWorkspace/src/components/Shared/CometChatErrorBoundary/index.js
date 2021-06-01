import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";

import Translator from "../../../resources/localization/translator";

import {
    errorContainerStyle,
} from "./style";

export class CometChatErrorBoundary extends React.Component {

    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        this.logErrorToMyService(error, errorInfo);
    }

    logErrorToMyService = console.log

    render() {

        if (this.state.hasError) {
            // You can render any custom fallback UI
            return <div css={errorContainerStyle()}>{Translator.translate("USER_NOT_LOGGED_IN", this.props.lang)}</div>;
        }

        return this.props.children;
    }
}

CometChatErrorBoundary.defaultProps = {
    lang: Translator.getDefaultLanguage(),
}

CometChatErrorBoundary.propTypes = {
    lang: PropTypes.string,
}