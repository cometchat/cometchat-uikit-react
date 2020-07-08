import React, { useState } from "react";

import "./style.scss";

import Avatar from "../Avatar";

const AddMemberView = (props) => {

  const [checked, setChecked] = useState(() => {
    const found = props.members.find(member => member.uid === props.user.uid);
    const value = (found) ? true : false;

    return value;
  });

  const handleCheck = (event) => {

    const value = (checked === true) ? false : true;
    setChecked(value);
    props.changed(props.user, value);
  }
  
  return (
    <tr>
      <td>
        <span className="avatar">
          <Avatar 
          image={props.user.avatar} 
          cornerRadius="50%" 
          borderColor="#CCC" 
          borderWidth="1px" />
        </span>
        <span className="name">{props.user.name}</span>
      </td>
      <td>
      <input 
        type="checkbox" 
        checked={checked}
        id={props.user.uid+"sel"} 
        onChange={handleCheck}  />
        <label htmlFor={props.user.uid+"sel"}>&nbsp;</label>
      </td>
    </tr>
  )
}

export default AddMemberView;