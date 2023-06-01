import "my-cstom-package-lit";
import { useContext, useState } from 'react';
import { MenuListStyle } from 'my-cstom-package-lit';
import { BaseStyle, MessageBubbleAlignment, Placement } from 'uikit-utils-lerna';
import { CometChatActionsIcon, CometChatActionsView } from "uikit-resources-lerna";
import { MessageBubbleWrapperStyles, MessageBubbleContainerStyles, MessageBubbleAvatarStyles, MessageBubbleAlignmentStyles, MessageBubbleTitleStyles, MessageOptionsStyles } from "./style";
import { CometChatContextMenu } from "../CometChatContextMenu";
import { CometChatContext } from "../../../CometChatContext";
import MoreIcon from "./assets/More@2x.svg";

interface IMessageBubbleProps {
  id: any;
  leadingView: any;
  headerView: any;
  replyView: any;
  contentView: any;
  bottomView: any;
  threadView: any;
  footerView: any;
  options: (CometChatActionsIcon | CometChatActionsView)[];
  alignment: MessageBubbleAlignment;
  messageBubbleStyle: BaseStyle,
  moreIconURL?: string,
  topMenuSize?: number
};

const CometChatMessageBubble = (props: IMessageBubbleProps) => {
  const {
    id,
    leadingView = null,
    headerView = null,
    replyView = null,
    contentView = null,
    bottomView = null,
    threadView = null,
    footerView = null,
    options = [],
    alignment = MessageBubbleAlignment.right,
    messageBubbleStyle = new BaseStyle({
      width: "100%",
      height: "auto",
      background: "",
      borderRadius: "12px",
      border: "none"
    }),
    moreIconURL = MoreIcon,
    topMenuSize = 3
  } = props;

  const contentStyle = {
    borderRadius:'8px'
  };

  const {theme} = useContext(CometChatContext);

  const menuListStyles = new MenuListStyle({
    border:`1px solid ${theme.palette.getAccent100()}`,
    borderRadius: "8px",
    background: theme.palette.getBackground(),
    submenuWidth: "100%",
    submenuHeight: "100%",
    submenuBorder: `1px solid ${theme.palette.getAccent100()}`,
    submenuBorderRadius: "8px",
    submenuBackground: theme.palette.getBackground(),
    moreIconTint:theme.palette.getAccent()
  })
  
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const showHideMessageOptions = () => {
    setIsHovering(!isHovering);
  }

  const getLeadingView = () => {
    if (leadingView && alignment === MessageBubbleAlignment.left) {
      return (

        <div
          className='cc__messagebubble__avatar'
          style={MessageBubbleAvatarStyles()}
        >
          {leadingView}
        </div >
      )
    }
  }

  const getHeaderView = () => {
    if (headerView) {
      return (
        <div
          className='cc__messagebubble__title'
          style={MessageBubbleTitleStyles(alignment, MessageBubbleAlignment)}
        >
          {headerView}
        </div>
      )
    }
  }

  const onOptionClicked = (data : CometChatActionsIcon | CometChatActionsView) => {
    options.forEach((option) => {
      if(option instanceof CometChatActionsIcon){
        if(option.id === data?.id && id){
          option.onClick?.(parseInt(id));
        }
      }
    });
  }

  const getMessageOptions = () => {
    if (options && options.length > 0 && isHovering) {
      return (
        <div className='cc__messageoptions'
          style={MessageOptionsStyles(alignment, MessageBubbleAlignment, headerView, theme)}
        >
          <CometChatContextMenu 
            moreIconURL={moreIconURL}
            topMenuSize={topMenuSize}
            ContextMenuStyle={menuListStyles}
            data={options}
            moreIconHoverText={''} 
            onOptionClicked={onOptionClicked}       
            placement={alignment === MessageBubbleAlignment.right ? Placement.left : Placement.right}     
          />
        </div>
      )
    }
  }
  return (
    <div className='cc__messagebubble__wrapper'
      style={MessageBubbleWrapperStyles(alignment, MessageBubbleAlignment)}
    >
      <div className='cc__messagebubble__container'
      style={MessageBubbleContainerStyles()}
        onMouseEnter={showHideMessageOptions}
        onMouseLeave={showHideMessageOptions}
      >
        {getLeadingView()}
        <div className='cc__messagebubble'
          style={MessageBubbleAlignmentStyles(alignment, MessageBubbleAlignment)}
        >
          {getHeaderView()}
          {getMessageOptions()}
          <div
            className='cc__messagebubble__content'
            style={{...messageBubbleStyle, ...contentStyle}}
          >
            {replyView ? replyView : null}
            {contentView ? contentView : null}
            {bottomView ? bottomView : null}
            {threadView ? threadView : null}
          </div>
          {footerView ? footerView : null}
        </div>
      </div>
    </div>
  )
}

export { CometChatMessageBubble }