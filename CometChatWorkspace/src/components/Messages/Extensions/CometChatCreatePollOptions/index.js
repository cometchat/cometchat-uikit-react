import { useContext } from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";

import { CometChatContext } from "../../../../util/CometChatContext";

import { iconWrapperStyle } from "../CometChatCreatePoll/style";

import Translator from "../../../../resources/localization/translator";

import { removeOptionIconStyle } from "./style";
import removeIcon from "./resources/remove.svg";

const CometChatCreatePollOptions = (props) => {

    const context = useContext(CometChatContext);

    return (
        <tr className="poll__options">
            <td>&nbsp;</td>
            <td>
                <input 
                autoFocus
                tabIndex={props.tabIndex}
                type="text" 
                autoComplete="off" 
                placeholder={Translator.translate("ENTER_YOUR_OPTION", props.lang)}
                value={props.value}
                onChange={(event) => props.optionChangeHandler(event, props.option)} />
            </td>
            <td css={iconWrapperStyle()} className="option__remove">
                <span css={removeOptionIconStyle(removeIcon, context)} onClick={() => props.removePollOption(props.option)}></span>
            </td>
        </tr>
    );
}

// Specifies the default values for props:
CometChatCreatePollOptions.defaultProps = {
    lang: Translator.getDefaultLanguage(),
};

CometChatCreatePollOptions.propTypes = {
    lang: PropTypes.string,
}

export { CometChatCreatePollOptions };