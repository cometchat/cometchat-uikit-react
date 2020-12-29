/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';

import { iconWrapperStyle } from "../CometChatCreatePoll/style";
import { removeOptionIconStyle } from "./style";

import Translator from "../../resources/localization/translator";
import removeIcon from "./resources/remove.png";

const createpollview = (props) => {

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
                <span css={removeOptionIconStyle(removeIcon)} onClick={() => props.removePollOption(props.option)}></span>
            </td>
        </tr>
    );
}

// Specifies the default values for props:
createpollview.defaultProps = {
    lang: Translator.getDefaultLanguage(),
};

createpollview.propTypes = {
    lang: PropTypes.string,
}

export default createpollview;