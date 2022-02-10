import React from "react";
import PropTypes from "prop-types";

import { localize } from "../../../";
import { iconWrapperStyle } from "../CometChatCreatePoll/style";

import { removeOptionIconStyle } from "./style";

import removeIcon from "./resources/remove.svg";

const CometChatCreatePollOptions = props => {

    const onChange = event => {
        props.optionChangeHandler(event, props.option);
    }

	return (
		<tr className="poll__options">
			<td>&nbsp;</td>
			<td>
				<input autoFocus tabIndex={props.tabIndex} type="text" autoComplete="off" placeholder={localize("ENTER_YOUR_OPTION")} value={props.value} onChange={onChange} />
			</td>
			<td style={iconWrapperStyle()} className="option__remove">
				<span style={removeOptionIconStyle(removeIcon)} onClick={() => props.removePollOption(props.option)}></span>
			</td>
		</tr>
	);
};

// // Specifies the default values for props:
// CometChatCreatePollOptions.defaultProps = {
//     lang: Translator.getDefaultLanguage(),
// };

// CometChatCreatePollOptions.propTypes = {
//     lang: PropTypes.string,
// }

export { CometChatCreatePollOptions };
