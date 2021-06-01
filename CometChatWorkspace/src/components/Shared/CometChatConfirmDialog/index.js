import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import {jsx} from "@emotion/core";

import { CometChatBackdrop } from "../";

import {alertWrapperStyle, alertMessageStyle, alertButtonStyle} from "./style";

class CometChatConfirmDialog extends React.Component {

    render() {

        return (
            <React.Fragment>
                <CometChatBackdrop show={this.props.open} clicked={this.props.close} />
                <div className="confirm__dialog" css={alertWrapperStyle(this.props)}>
                    <div className="confirm__message" css={alertMessageStyle(this.props)}>{this.props?.message}</div>
                    <div className="confirm__buttons" css={alertButtonStyle(this.props)}>
                        <button type="button" value="no" onClick={this.props.onClick}>No</button>
                        <button type="button" value="yes" onClick={this.props.onClick}>Yes</button>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export {CometChatConfirmDialog};