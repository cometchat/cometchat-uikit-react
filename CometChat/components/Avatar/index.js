import React from "react";
import "./style.scss";

const avatar = (props) => {
  
  const borderWidth = props.borderWidth || '1px';
  const borderColor = props.borderColor || '#AAA';
  const cornerRadius = props.cornerRadius || '50%';
  const image = props.image;

  const getStyle = () => ({borderWidth:borderWidth, borderStyle:'solid',borderColor:borderColor ,'borderRadius': cornerRadius})

  return (
    <img src={image} alt="Avatar" style={getStyle()} />
  );
    
}

export default avatar;