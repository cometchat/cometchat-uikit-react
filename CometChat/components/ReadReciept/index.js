import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { msgTimestampStyle } from "./style";

import blueDoubleTick from "./resources/blue-double-tick-icon.png";
import greyDoubleTick from "./resources/grey-double-tick-icon.png";
import greyTick from "./resources/grey-tick-icon.png";

const readreceipt = (props) => {

    let ticks = blueDoubleTick;
    if(props.message.sentAt && !props.message.readAt && !props.message.deliveredAt){
      ticks = greyTick;
    } else if(props.message.sentAt && !props.message.readAt && props.message.deliveredAt){
      ticks = greyDoubleTick;
    }

    if(props.hasOwnProperty("widgetsettings") 
    && props.widgetsettings
    && props.widgetsettings.hasOwnProperty("main") 
    && props.widgetsettings.main.hasOwnProperty("show_delivery_read_indicators")
    && props.widgetsettings.main["show_delivery_read_indicators"] === false) {
      ticks = null;
    }

    const receipt = (ticks) ? <img src={ticks} alt="time" /> : null;
    const timestamp = new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    return (
      <span css={msgTimestampStyle()}>{timestamp}{receipt}</span>
    );
}

export default readreceipt;