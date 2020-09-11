import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import {
    presenceStyle
} from "./style";

const statusindicator = (props) => {

    if(props.hasOwnProperty("widgetsettings") 
    && props.widgetsettings
    && props.widgetsettings.hasOwnProperty("main") 
    && props.widgetsettings.main.hasOwnProperty("show_user_presence")
    && props.widgetsettings.main["show_user_presence"] === false) {
        return null;
    }

    const borderWidth = props.borderWidth || '1px';
    const borderColor = props.borderColor || '#AAA';
    const cornerRadius = props.cornerRadius || '50%';
  
    const getStyle = () => ({borderWidth:borderWidth, borderStyle:'solid',borderColor:borderColor ,'borderRadius': cornerRadius})

    return (
        <span css={presenceStyle(props)} style={getStyle()}></span>
    );
}

export default statusindicator;