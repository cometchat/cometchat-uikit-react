import React from "react";
import "./style.scss";

import Avatar from "../Avatar";

const groupview = (props) => {

  return (

    <div className="group-listitem clearfix">
      <div className="group-thumbnail-wrap">
        <Avatar 
        image={props.group.icon} 
        cornerRadius="18px" 
        borderColor="#CCC"
        borderWidth="1px"></Avatar>
      </div>
      <div className="group-listitem-dtls">
        <span className="group-listitem-name">{props.group.name}</span>
      </div>
    </div>
  )
}

export default groupview;