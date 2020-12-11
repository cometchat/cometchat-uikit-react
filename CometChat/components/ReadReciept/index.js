import React from "react";
import dateFormat from "dateformat";
/** @jsx jsx */
import { jsx } from '@emotion/core';

import { validateWidgetSettings } from "../../util/common";

import { msgTimestampStyle } from "./style";

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

    let ticks = null;
    if(this.state.message.messageFrom === "sender") {

      ticks = blueDoubleTick;
      if (this.props.message.sentAt && !this.props.message.readAt && !this.props.message.deliveredAt) {
        ticks = greyTick;
      } else if (this.props.message.sentAt && !this.props.message.readAt && this.props.message.deliveredAt) {
        ticks = greyDoubleTick;
      }
    }

    //if delivery receipts are disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "show_delivery_read_indicators") === false) {
      ticks = null;
    }
    
    const receipt = (ticks) ? <img src={ticks} alt="time" /> : null;

    const messageDate = (this.state.message.sentAt * 1000);
    const timestamp = dateFormat(messageDate, "shortTime");
    
    return(
      <span css={msgTimestampStyle(this.props, this.state)} className="message__timestamp">{timestamp}{receipt}</span>
    )
  }
}

export default ReadReceipt;