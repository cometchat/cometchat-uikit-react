import React from "react";
import "./style.scss";

import Avatar from "../Avatar";

const groupview = (props) => {

  return (

    <div className="chat-ppl-listitem clearfix">
      <div className="chat-ppl-thumbnail-wrap grp-chat-ppl-thumbnail-wrap">
        <Avatar 
        image={props.group.icon} 
        cornerRadius="18px" 
        borderColor="#CCC"
        borderWidth="1px"></Avatar>
      </div>
      <div className="chat-ppl-listitem-dtls">
          <span className="chat-ppl-listitem-name">{props.group.name}</span>
      </div>
    </div>
  )
}

export default groupview;