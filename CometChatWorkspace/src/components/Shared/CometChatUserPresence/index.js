/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";

import { validateWidgetSettings } from "../../../util/common";

import { presenceStyle } from "./style";

const CometChatUserPresence = (props) => {

    //if user presence is disabled in chat widget
    if (validateWidgetSettings(props.widgetsettings, "show_user_presence") === false) {
        return null;
    }

    const borderWidth = props.borderWidth;
    const borderColor = props.borderColor;
    const cornerRadius = props.cornerRadius;
  
    const getStyle = () => ({borderWidth:borderWidth, borderStyle:'solid', borderColor:borderColor , 'borderRadius': cornerRadius})

    return (
        <span css={presenceStyle(props)} className="presence" style={getStyle()}></span>
    );
}

// Specifies the default values for props:
CometChatUserPresence.defaultProps = {
    borderWidth: "1px",
    borderColor: "#AAA",
    cornerRadius: "50%",
};

CometChatUserPresence.propTypes = {
    borderWidth: PropTypes.string,
    borderColor: PropTypes.string,
    cornerRadius: PropTypes.string,
}

export default CometChatUserPresence;