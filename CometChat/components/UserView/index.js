import React from "react";
import "./style.scss";

import Avatar from "../Avatar";
import StatusIndicator from "../StatusIndicator";

const userview = (props) => {
  
  return (

    <div className='contact-listitem'>
      <div className='contact-thumbnail-wrap'>
        <Avatar 
        image={props.user.avatar} 
        cornerRadius="50%" 
        borderColor="#CCC" 
        borderWidth="1px" />
        <StatusIndicator
          status={props.user.status}
          cornerRadius="50%" 
          borderColor="rgb(238, 238, 238)" 
          borderWidth="1px" />
      </div>
      <div className="contact-listitem-dtls">
          <div className="contact-listitem-name">{props.user.name}</div>
      </div>
    </div>
  )
}

export default userview;