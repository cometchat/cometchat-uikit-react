import React from "react";
import "./style.scss";

import Avatar from "../Avatar";

const userview = (props) => {
  
  return (

    <div className='chat-contact-listitem'>
      <div className='chat-contact-listitem-thum'>
        <Avatar 
        image={props.user.avatar} 
        cornerRadius="50%" 
        borderColor="#CCC" 
        borderWidth="1px"></Avatar>
      </div>
      <div className='chat-contact-listitem-name'>{props.user.name}</div>          
    </div>
  )
}

export default userview;