import React from "react";
import "./style.scss";

const badgecount = (props) => {

  let count = "";

  if(props.count) {
    count = (
      <span className="chat-ppl-listitem-msg-cnt">{props.count}</span>
    );
  }
  return count;
}

export default badgecount;