import React from "react";
import PropTypes from 'prop-types';
import { getPlaceholderWrapper  } from "./style";

const CometChatPlaceholderBubble = (props) => {
  return <div
    style={ getPlaceholderWrapper(props)}
    className="placeholder_wrapper"
  >
  {props.text} 
    
    </div>;
};

CometChatPlaceholderBubble.defaultProps = {
  key: "",
	style:{},
  text: ""
}

CometChatPlaceholderBubble.propTypes = {
  key: PropTypes.string,
  style: PropTypes.object,
  text: PropTypes.string,
}
export { CometChatPlaceholderBubble };
