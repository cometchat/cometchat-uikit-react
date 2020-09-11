import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import {
  badgeStyle
} from "./style";

const badgecount = (props) => {

  let count = "";

  if(props.count) {
    count = (
      <span css={badgeStyle(props)}>{props.count}</span>
    );
  }
  return count;
}

export default badgecount;