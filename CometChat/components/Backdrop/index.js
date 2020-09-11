import React from 'react';

/** @jsx jsx */
import { jsx } from '@emotion/core';

import {
    backdropStyle
} from "./style";

const backdrop = (props) => (
    props.show ? <div css={backdropStyle()}  onClick={props.clicked}></div> : null
);

export default backdrop;