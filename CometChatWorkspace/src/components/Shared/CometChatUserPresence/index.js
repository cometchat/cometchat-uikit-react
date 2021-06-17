import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import {jsx} from "@emotion/core"
import PropTypes from "prop-types"

import {CometChatContext} from "../../../util/CometChatContext"

import {presenceStyle} from "./style"

const CometChatUserPresence = props => {

	const context = React.useContext(CometChatContext);
    const [presence, setPresence] = React.useState(false);

    const togglePresence = () => {

        context.FeatureRestriction.isUserPresenceEnabled().then(response => {

            if (response !== presence) {
                setPresence(response);
            }

        }).catch(error => {

            if (presence !== false) {
                setPresence(false);
            }
        })

    }

    React.useEffect(togglePresence);

	//if user presence feature is disabled
	if (presence === false) {
		return null
	}

	const borderWidth = props.borderWidth
	const borderColor = props.borderColor
	const cornerRadius = props.cornerRadius

	const getStyle = () => ({borderWidth: borderWidth, borderStyle: "solid", borderColor: borderColor, borderRadius: cornerRadius})

	return <span css={presenceStyle(props)} className="presence" style={getStyle()}></span>
}

// Specifies the default values for props:
CometChatUserPresence.defaultProps = {
	borderWidth: "1px",
	borderColor: "#eaeaea",
	cornerRadius: "50%",
};

CometChatUserPresence.propTypes = {
	borderWidth: PropTypes.string,
	borderColor: PropTypes.string,
	cornerRadius: PropTypes.string,
}

export {CometChatUserPresence}