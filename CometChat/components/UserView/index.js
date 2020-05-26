import React from "react";
import "./style.scss";

import Avatar from "../Avatar";

const userview = (props) => {
  
  return (
    <div className="cp-userview">
      <div className="row" >
        <div className="col-xs-1 cp-user-avatar">
          <Avatar 
          image={props.user.avatar} 
          cornerRadius="50%" 
          borderColor="#CCC" 
          borderWidth="1px"></Avatar>
        </div>
        <div className="col cp-user-info">
          <div className="cp-username cp-ellipsis font-bold">{props.user.name}</div>              
        </div>
      </div>
    </div>
  )
}

export default userview;