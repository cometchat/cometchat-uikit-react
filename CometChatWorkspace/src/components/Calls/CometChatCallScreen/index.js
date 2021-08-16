import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";
import PropTypes from "prop-types";

import { CometChat } from "@cometchat-pro/chat";

import { CometChatContext } from "../../../util/CometChatContext";
import { Storage } from "../../../util/Storage";
import * as enums from "../../../util/enums.js";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
    callScreenBackgroundStyle,
    callScreenContainerStyle,
    callScreenInnerBackgroundStyle,
    callScreenHeaderStyle,
    callScreenWrapperStyle,
    headerTitleStyle,
    headerButtonStyle,
    callScreenResizerStyle,
    iconStyle
} from "./style";

import minimizeIcon from "./resources/reduce-size.svg";
import maximizeIcon from "./resources/increase-size.svg";

class CometChatCallScreen extends React.PureComponent {

    static contextType = CometChatContext;

    constructor(props) {
        super(props);

        this.state = {
            x: 0,
            y: 0,
            rel: null, // position relative to the cursor
            dragging: false,
            maximized: true
        };

        this.loggedInUser = props.loggedInUser;
        
        this.callScreenBackgroundEl = React.createRef();
        this.callScreenInnerBackgroundEl = React.createRef();
        this.callScreenEl = React.createRef();
        this.callScreenFrame = React.createRef();
    }

    componentDidMount() {

        this.document = window.document;

        if (this.props.call.type === enums.CUSTOM_TYPE_MEETING) {
            this.startDirectCall(this.props.call);
        } else {
            this.startDefaultCall(this.props.call);
        }
    }

    enableDragging = (e) => {

        e.preventDefault();
        
        if (this.checkIfCallScreenIsMaximized() === true) {
            return false;
        }

        this.setState({
            dragging: true,
            rel: {
                x: e.pageX - this.state.x,
                y: e.pageY - this.state.y
            }
        });

        this.toggleCallScreenBackground(true);
        this.toggleCallScreenInnerBackground(true);

        this.document.onmousemove = (e) => this.startDragging(e);
        this.document.onmouseup = (e) => this.disableDragging(e);
    }

    checkIfCallScreenIsMaximized = () => {

        const elem = this.callScreenEl.current;

        const dialogWidth = elem.clientWidth;
        const dialogHeight = elem.clientHeight;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (dialogWidth === windowWidth && dialogHeight === windowHeight) {
            return true;
        }

        return false;
    }

    checkIfCallScreenIsMinimized = () => {

        const elem = this.callScreenEl.current;

        const dialogWidth = elem.clientWidth;
        const dialogHeight = elem.clientHeight;

        const minimumWidth = this.props.minWidth;
        const minimumHeight = this.props.minHeight;

        if (dialogWidth === minimumWidth && dialogHeight === minimumHeight) {
            return true;
        }

        return false;
    }

    startDragging = (e) => {
        
        if (!this.state.dragging) return;
        
        e = e || window.event;

        const elem = this.callScreenEl.current;

        const dialogWidth = elem.clientWidth; 
        const dialogHeight = elem.clientHeight; 
        const x = Math.min(
            Math.max(0, e.pageX - this.state.rel.x),
            window.innerWidth - dialogWidth - 20
        );
        const y = Math.min(
            Math.max(0, e.pageY - this.state.rel.y),
            window.innerHeight - dialogHeight - 20
        ); 

        this.setState({
            x: x,
            y: y
        });

        e.stopPropagation();
        e.preventDefault();
    }

    disableDragging = (e) => {

        this.document.onmousemove = null;
        this.document.onmouseup = null;

        this.setState({ dragging: false });

        this.toggleCallScreenBackground(false);
        this.toggleCallScreenInnerBackground(false);
    }

    initResize = (e) => {

        e.preventDefault();

        if (this.checkIfCallScreenIsMaximized() === true) {
            return false;
        }

        const element = this.callScreenEl.current;

        this.startX = e.pageX;
        this.startY = e.pageY;

        this.startWidth = parseFloat(getComputedStyle(element, null).getPropertyValue("width").replace("px", ""));
        this.startHeight = parseInt(getComputedStyle(element, null).getPropertyValue("height").replace("px", ""));

        this.document.onmousemove = (e) => this.startResize(e);
        this.document.onmouseup = (e) => this.stopResize(e);
    }

    startResize = (e) => {
        
        let width = this.startWidth + (e.pageX - this.startX);
        let height = this.startHeight + (e.pageY - this.startY);

        if (width < this.props.minWidth) {
            width = this.props.minHWidth;
        }

        if (width > window.innerWidth) {
            width = this.props.maxWidth;
        }

        if (height < this.props.minHeight) {
            height = this.props.minHeight;
        }

        if (height > window.innerHeight) {
            height = this.props.maxHeight;
        }

        this.callScreenEl.current.style.width = width + "px";
        this.callScreenEl.current.style.height = height + "px";

        this.setDimensionOfCallScreenInnerBackground({ width: width + "px", height: height + "px" });

        this.toggleCallScreenBackground(true);
        this.toggleCallScreenInnerBackground(true);
    }

    stopResize = () => {
        
        this.document.onmousemove = null;
        this.document.onmouseup = null;

        this.toggleCallScreenBackground(false);
        this.toggleCallScreenInnerBackground(false);

        if (this.checkIfCallScreenIsMaximized() === true) {
            this.setState({ maximized: true });
        } 
        if (this.checkIfCallScreenIsMinimized() === true) {
            this.setState({ maximized: false });
        }
    }

    toggleCallScreenBackground = (flag) => {

        if (this.callScreenBackgroundEl && this.callScreenBackgroundEl.current) {
            this.callScreenBackgroundEl.current.style.display = (flag) ? "block" : "none";
        }
    }

    toggleCallScreenInnerBackground = (flag) => {

        if (this.callScreenInnerBackgroundEl && this.callScreenInnerBackgroundEl.current) {
            this.callScreenInnerBackgroundEl.current.style.display = (flag) ? "block" : "none";
        }
    }

    setDimensionOfCallScreenInnerBackground = (props) => {

        this.callScreenInnerBackgroundEl.current.style.width = props.width;
        this.callScreenInnerBackgroundEl.current.style.height = props.height;
    }

    setPositionOfCallScreenInnerBackground = (props) => {

        this.callScreenInnerBackgroundEl.current.style.top = props.y;
        this.callScreenInnerBackgroundEl.current.style.left = props.x;
    }

    minimize = () => {

        if (!this.callScreenEl || !this.callScreenEl.current) {
            return false;
        }

        const width = this.props.minWidth + "px";
        const height = this.props.minHeight + "px";

        this.setState({ maximized: false });
        this.setSizingAndPostionOfCallScreen({ width: width, height: height });
        this.setDimensionOfCallScreenInnerBackground({ width: width, height: height });
        this.setPositionOfCallScreenInnerBackground({ x: "0px", y: "0px" });
    }

    maximize = () => {

        if (!this.callScreenEl || !this.callScreenEl.current) {
            return false;
        }

        const width = this.props.maxWidth;
        const height = this.props.maxHeight;

        this.setState({ maximized: true });
        this.setSizingAndPostionOfCallScreen({ width: width, height: height });
        this.setDimensionOfCallScreenInnerBackground({ width: width, height: height });
        this.setPositionOfCallScreenInnerBackground({ x: "0px", y: "0px" });
    }

    setSizingAndPostionOfCallScreen = (props) => {

        this.callScreenEl.current.style.width = props.width;
        this.callScreenEl.current.style.height = props.height;
        this.callScreenEl.current.style.top = "0px";
        this.callScreenEl.current.style.left = "0px";
    }

    toggle = (e) => {

        this.setState({ x: 0, y: 0 });

        if (this.state.maximized) {
            this.minimize();
        } else {
            this.maximize();
        }

        e.stopPropagation();
        e.preventDefault();
    }

    startDirectCall = (call) => {

        const sessionId = call.data.customData.sessionID;
        const customCSS = this.context.UIKitSettings.customCSS;

        const callSettings = new CometChat.CallSettingsBuilder()
            .enableDefaultLayout(true)
            .setSessionID(sessionId)
            .setIsAudioOnlyCall(false)
            .setCustomCSS(customCSS)
            .setLocalizedStringObject({
                "SELECT_VIDEO_SOURCE": Translator.translate("SELECT_VIDEO_SOURCE", this.props.lang),
                "SELECT_INPUT_AUDIO_SOURCE": Translator.translate("SELECT_INPUT_AUDIO_SOURCE", this.props.lang),
                "SELECT_OUTPUT_AUDIO_SOURCE": Translator.translate("SELECT_OUTPUT_AUDIO_SOURCE", this.props.lang),
                "SELECT_MODE": Translator.translate("SELECT_MODE", this.props.lang)
            }).build();

        const el = this.callScreenFrame;
        CometChat.startCall(
            callSettings,
            el,
            new CometChat.OngoingCallListener({
                onCallEnded: call => {

                    if (this.context) {
                        this.context.setCallInProgress({}, "");
                    }
                    Storage.removeItem(enums.CONSTANTS["ACTIVECALL"]);
                    this.props.actionGenerated(enums.ACTIONS["DIRECT_CALL_ENDED"]);
                },
                onError: error => {

                    if (this.context) {
                        this.context.setCallInProgress(null, "");
                    }
                    
                    this.props.actionGenerated(enums.ACTIONS["DIRECT_CALL_ERROR"]);
                    const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
                    this.context.setToastMessage("error", errorCode);
                }
            })
        );
    }

    startDefaultCall = (call) => {

        const sessionId = call.getSessionId();
        const callType = (call.type === CometChat.CALL_TYPE.AUDIO ? true : false);
        const customCSS = this.context.UIKitSettings.customCSS;

        const callSettings = new CometChat.CallSettingsBuilder()
            .setSessionID(sessionId)
            .enableDefaultLayout(true)
            .setMode(CometChat.CALL_MODE.DEFAULT)
            .setIsAudioOnlyCall(callType)
            .setCustomCSS(customCSS)
            .setLocalizedStringObject({
                "SELECT_VIDEO_SOURCE": Translator.translate("SELECT_VIDEO_SOURCE", this.props.lang),
                "SELECT_INPUT_AUDIO_SOURCE": Translator.translate("SELECT_INPUT_AUDIO_SOURCE", this.props.lang),
                "SELECT_OUTPUT_AUDIO_SOURCE": Translator.translate("SELECT_OUTPUT_AUDIO_SOURCE", this.props.lang)
            }).build();


        const el = this.callScreenFrame;
        CometChat.startCall(
            callSettings,
            el,
            new CometChat.OngoingCallListener({
                onUserJoined: user => {

                    /* Notification received here if another user joins the call. */
                    /* this method can be use to display message or perform any actions if someone joining the call */
                    //call initiator gets the same info in outgoingcallaccpeted event
                    if (call.callInitiator.uid !== this.loggedInUser.uid && call.callInitiator.uid !== user.uid) {

                        const callMessage = {
                            "category": call.category,
                            "type": call.type,
                            "action": call.action,
                            "status": call.status,
                            "callInitiator": call.callInitiator,
                            "callReceiver": call.callReceiver,
                            "receiverId": call.receiverId,
                            "receiverType": call.receiverType,
                            "sentAt": call.sentAt,
                            "sender": { ...user }
                        };
                        this.props.actionGenerated(enums.ACTIONS["USER_JOINED_CALL"], callMessage);
                    }
                },
                onUserLeft: user => {
                    /* Notification received here if another user left the call. */
                    /* this method can be use to display message or perform any actions if someone leaving the call */
                    //call initiator gets the same info in outgoingcallaccpeted event
                    if (call.callInitiator.uid !== this.loggedInUser.uid && call.callInitiator.uid !== user.uid) {

                        const callMessage = {
                            "category": call.category,
                            "type": call.type,
                            "action": "left",
                            "status": call.status,
                            "callInitiator": call.callInitiator,
                            "callReceiver": call.callReceiver,
                            "receiverId": call.receiverId,
                            "receiverType": call.receiverType,
                            "sentAt": call.sentAt,
                            "sender": { ...user }
                        };

                        this.props.actionGenerated(enums.ACTIONS["USER_LEFT_CALL"], callMessage);
                    }
                },
                onCallEnded: endedCall => {

                    /* Notification received here if current ongoing call is ended. */
                    if (this.context) {
                        this.context.setCallInProgress(null, "");
                    }
                    Storage.removeItem(enums.CONSTANTS["ACTIVECALL"]);
                    this.props.actionGenerated(enums.ACTIONS["OUTGOING_CALL_ENDED"], endedCall);
                    /* hiding/closing the call screen can be done here. */
                }
            })
        );
    }

    render() {

        const resizeText = Translator.translate("RESIZE", this.props.lang);
        let iconView = (<i css={iconStyle(minimizeIcon)} title={resizeText}></i>);
        if (this.state.maximized === false) {
            iconView = (<i css={iconStyle(maximizeIcon)} title={resizeText}></i>);
        }

        return (
            <React.Fragment>
                <div css={callScreenBackgroundStyle(this.state)} ref={this.callScreenBackgroundEl}></div>
                <div ref={this.callScreenEl} className="callscreen__container" css={callScreenContainerStyle(this.props)} 
                    style={{ top: this.state.y + "px", left: this.state.x + "px" }}>
                    <div css={callScreenInnerBackgroundStyle()} ref={this.callScreenInnerBackgroundEl}></div>
                    <div css={callScreenHeaderStyle(this.state)} className="callscreen__header" onMouseDown={this.enableDragging}>
                        <div css={headerTitleStyle()}>&nbsp;</div>
                        <div className="callscreen__resize" css={headerButtonStyle()} onClick={this.toggle} onMouseDown={e => e.stopPropagation()}><button type="button" title={resizeText}>{iconView}</button></div>
                    </div>
                    <div css={callScreenWrapperStyle(this.props, keyframes)} className="callscreen__wrapper" ref={el => { this.callScreenFrame = el; }}></div>
                    <div css={callScreenResizerStyle(this.state)} className="callscreen__resizer-both" onMouseDown={this.initResize}></div>
                </div>
            </React.Fragment>
        )
    }
}

// Specifies the default values for props:
CometChatCallScreen.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme,
    minWidth: 400,
    minHeight: 300,
    maxWidth: "100%",
    maxHeight: "100%",
    style: {},
};

CometChatCallScreen.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object,
    minWidth: PropTypes.number,
    minHeight: PropTypes.number,
    maxWidth: PropTypes.string,
    maxHeight: PropTypes.string,
    style: PropTypes.object,
}

export { CometChatCallScreen }
