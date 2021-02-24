import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { validateWidgetSettings, getMessageSentTime } from "../../../util/common";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

import { msgTimestampStyle } from "./style";

import blueDoubleTick from "./resources/blue-double-tick-icon.png";
import greyDoubleTick from "./resources/grey-double-tick-icon.png";
import greyTick from "./resources/grey-tick-icon.png";
import sendingTick from "./resources/sending.png";
import errorTick from "./resources/error.png";

class CometChatReadReceipt extends React.PureComponent { 

  constructor(props) {

    super(props);
    this.state = {
      message: props.message
    }
  }

  componentDidUpdate(prevProps) {

    const previousMessageStr = JSON.stringify(prevProps.message);
    const currentMessageStr = JSON.stringify(this.props.message);

    if (previousMessageStr !== currentMessageStr) {
      this.setState({ message: this.props.message })
    }
  }

  render() {

    let ticks, receiptText = null, dateField = null;
    if(this.state.message.messageFrom === "sender") {

      if (this.state.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {

        if (this.state.message.hasOwnProperty("error")) {

          ticks = errorTick;
          receiptText = "ERROR";
          dateField = this.state.message._composedAt;

        } else {

          ticks = sendingTick;
          receiptText = "SENDING";
          dateField = this.state.message._composedAt;

          if (this.state.message.hasOwnProperty("sentAt")) {

            ticks = greyTick;
            receiptText = "SENT";
            dateField = this.state.message.sentAt;
          }
        }

      } else {

        if (this.state.message.hasOwnProperty("error")) {

          ticks = errorTick;
          receiptText = "ERROR";
          dateField = this.state.message._composedAt;

        } else {

          ticks = sendingTick;
          receiptText = "SENDING";
          dateField = this.state.message._composedAt;

          if (this.state.message.hasOwnProperty("sentAt")) {

            ticks = greyTick;
            receiptText = "SENT";
            dateField = this.state.message.sentAt;

            if (this.state.message.hasOwnProperty("deliveredAt")) {

              ticks = greyDoubleTick;
              receiptText = "DELIVERED";

              if (this.state.message.hasOwnProperty("readAt")) {

                ticks = blueDoubleTick;
                receiptText = "SEEN";
              }
            }
          }
          
        }

      }

    } else {
      dateField = this.state.message.sentAt;
    }

    //if delivery receipts are disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "show_delivery_read_indicators") === false) {
      ticks = null;
    }
    
    const receipt = (ticks) ? <img src={ticks} alt={Translator.translate(receiptText, this.props.lang)} /> : null;

    const timestamp = getMessageSentTime(dateField, this.props.lang);
    
    return(
      <span css={msgTimestampStyle(this.props, this.state)} className="message__timestamp">{timestamp}{receipt}</span>
    )
  }
}

// Specifies the default values for props:
CometChatReadReceipt.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
};

CometChatReadReceipt.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default CometChatReadReceipt;