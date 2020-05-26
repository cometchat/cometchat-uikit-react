import React from "react";
import "./style.scss";

import Avatar from "../Avatar";

const groupview = (props) => {

  return (
    <div className="cp-groupview">
      <div className="row">
        <div className="col-xs-1 cp-group-icon">
          <Avatar 
          image={props.group.icon} 
          cornerRadius="50%" 
          borderColor="#CCC"
          borderWidth="1px"></Avatar>
        </div>
        <div className="col cp-user-info">
          <div className="cp-username font-bold cp-ellipsis">{props.group.name}</div>              
        </div>    
      </div>
    </div>
  )
}

export default groupview;