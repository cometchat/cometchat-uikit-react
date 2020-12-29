/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';

import {
    backdropStyle
} from "./style";

const backdrop = (props) => (
    props.show ? <div css={backdropStyle()} className="modal__backdrop" onClick={props.clicked}></div> : null
);

// Specifies the default values for props:
backdrop.defaultProps = {
    count: 0,
    clicked: () => {}
};

backdrop.propTypes = {
    show: PropTypes.bool,
    clicked: PropTypes.func,
}

export default backdrop;