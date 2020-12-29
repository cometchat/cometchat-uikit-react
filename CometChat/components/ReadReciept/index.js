import React from "react";
import dateFormat from "dateformat";
/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';

import { validateWidgetSettings } from "../../util/common";

import { msgTimestampStyle } from "./style";

import Translator from "../../resources/localization/translator";
import { theme } from "../../resources/theme";

import blueDoubleTick from "./resources/blue-double-tick-icon.png";
import greyDoubleTick from "./resources/grey-double-tick-icon.png";
import greyTick from "./resources/grey-tick-icon.png";

class ReadReceipt extends React.PureComponent { 

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

    let ticks, receiptText = null;
    if(this.state.message.messageFrom === "sender") {

      ticks = blueDoubleTick;
      receiptText = "SEEN";
      if (this.props.message.sentAt && !this.props.message.readAt && !this.props.message.deliveredAt) {
        ticks = greyTick;
        receiptText = "SENT";
      } else if (this.props.message.sentAt && !this.props.message.readAt && this.props.message.deliveredAt) {
        ticks = greyDoubleTick;
        receiptText = "DELIVERED";
      }
    }

    //if delivery receipts are disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "show_delivery_read_indicators") === false) {
      ticks = null;
    }
    
    const receipt = (ticks) ? <img src={ticks} alt={Translator.translate(receiptText, this.props.lang)} /> : null;

    const messageDate = (this.state.message.sentAt * 1000);
    const timestamp = dateFormat(messageDate, "shortTime");
    
    return(
      <span css={msgTimestampStyle(this.props, this.state)} className="message__timestamp">{timestamp}{receipt}</span>
    )
  }
}

// Specifies the default values for props:
ReadReceipt.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
};

ReadReceipt.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default ReadReceipt;