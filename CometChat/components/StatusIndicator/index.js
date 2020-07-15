import React from "react";
import "./style.scss";

const statusindicator = (props) => {

    const borderWidth = props.borderWidth || '1px';
    const borderColor = props.borderColor || '#AAA';
    const cornerRadius = props.cornerRadius || '50%';
  
    const getStyle = () => ({borderWidth:borderWidth, borderStyle:'solid',borderColor:borderColor ,'borderRadius': cornerRadius})

    const presenceClass = `presence ${props.status}`;
    return (
        <span className={presenceClass} style={getStyle()}></span>
    );
}

export default statusindicator;