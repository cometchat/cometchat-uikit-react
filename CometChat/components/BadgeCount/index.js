import React from "react";
import "./style.scss";

const badgecount = (props) => {

  let count = "";

  if(props.count) {
    count = (
      <div className="cp-badge-wrapper">
        <span className="cp-badge">{props.count}</span>
      </div>
    );
  }
  return count;
}

export default badgecount;