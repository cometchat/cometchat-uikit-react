import React from "react";
import PropTypes from "prop-types";

import { pollAnswerStyle, checkIconStyle, pollPercentStyle, answerWrapperStyle } from "./style";

import checkImg from "./resources/checkmark.svg";

const CometChatPollOptionBubble = props => {
	let width = "0%";
	if (props.voteCount) {
		const fraction = props.pollOption.count / props.voteCount;
		width = fraction.toLocaleString("en", { style: "percent" });
	}

	let checkIcon = null;
	if (props.pollOption.voters && props.pollOption.voters[props.loggedInUser?.uid]) {
		checkIcon = <i style={checkIconStyle(checkImg)}></i>;
	}

	return (
		<li style={pollAnswerStyle(props)}>
			<div style={pollPercentStyle(width)}> </div>
			<div style={answerWrapperStyle(props)}>
				{checkIcon}
				<span>{width}</span>
				<p>{props.pollOption.text}</p>
			</div>
		</li>
	);
};

CometChatPollOptionBubble.defaultProps = {
	pollOption: {},
	voteCount: 0,
	pollOptionsFont: "",
	pollOptionsColor: "rgb(230, 230, 230)",
	pollOptionsBackgroundColor: "#fff",
	loggedInUser: {},
};

CometChatPollOptionBubble.propTypes = {
	pollOption: PropTypes.object,
	voteCount: PropTypes.number,
	pollOptionsFont: PropTypes.string,
	pollOptionsColor: PropTypes.string,
	pollOptionsBackgroundColor: PropTypes.string,
	loggedInUser: PropTypes.object,
};

export { CometChatPollOptionBubble };
