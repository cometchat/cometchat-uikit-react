/** @jsx jsx */
import { jsx } from '@emotion/core'

import { SvgAvatar } from '../../util/svgavatar';

import Avatar from "../Avatar";
import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageThumbnailStyle,
  messageDetailStyle,
  nameWrapperStyle,
  nameStyle,
  messageVideoContainerStyle,
  messageVideoWrapperStyle,
  messageInfoWrapperStyle,
  messageTimestampStyle
} from "./style";

const receivervideobubble = (props) => {
  
  let avatar = null, name = null;
  if(props.message.receiverType === 'group') {

    if(!props.message.sender.avatar) {

      const uid = props.message.sender.getUid();
      const char = props.message.sender.getName().charAt(0).toUpperCase();

      props.message.sender.setAvatar(SvgAvatar.getAvatar(uid, char));
    } 

    avatar = (
      <div css={messageThumbnailStyle()} className="message__thumbnail">
        <Avatar 
        cornerRadius="50%" 
        borderColor={props.theme.color.secondary}
        borderWidth="1px"
        image={props.message.sender.avatar} />
      </div>
    );

    name = (<div css={nameWrapperStyle(avatar)} className="message__name__wrapper"><span css={nameStyle(props)} className="message__name">{props.message.sender.name}</span></div>);
  }

  const message = Object.assign({}, props.message, {messageFrom: "receiver"});
 
  return (

    <div css={messageContainerStyle()} className="receiver__message__container message__video">
      <ToolTip {...props} message={message} name={name} />    
      <div css={messageWrapperStyle()} className="message__wrapper">
        {avatar}
        <div css={messageDetailStyle(name)} className="message__details">
          {name}
          <div css={messageVideoContainerStyle()} className="message__video__container">
            <div css={messageVideoWrapperStyle(props)} className="message__video__wrapper">
              <video controls>
                <source src={props.message.data.url} />
              </video>                        
            </div>
          </div>
          <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
            <span css={messageTimestampStyle(props)} className="message__timestamp">{new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
            <ReplyCount {...props} message={message} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default receivervideobubble;