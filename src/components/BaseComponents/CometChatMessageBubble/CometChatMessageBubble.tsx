import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CometChatContextMenu } from "../CometChatContextMenu/CometChatContextMenu";
import { CometChatActionsIcon, CometChatActionsView, CometChatOption } from "../../../modals";
import { MessageBubbleAlignment, Placement } from "../../../Enums/Enums";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { CollaborativeDocumentConstants } from "../../Extensions/CollaborativeDocument/CollaborativeDocumentConstants";
import { CollaborativeWhiteboardConstants } from "../../Extensions/CollaborativeWhiteboard/CollaborativeWhiteboardConstants";
import { PollsConstants } from "../../Extensions/Polls/PollsConstants";
import { StickersConstants } from "../../Extensions/Stickers/StickersConstants";

/**Interface defining the structure for MessageBubbleProps */
interface MessageBubbleProps {
  id: string | number;
  setRef?: (ref: any) => void;
  leadingView?: JSX.Element | null;
  headerView?: JSX.Element | null;
  replyView?: JSX.Element | null;
  contentView?: JSX.Element | null;
  bottomView?: JSX.Element | null;
  threadView?: JSX.Element | null;
  footerView?: JSX.Element | null;
  statusInfoView?: JSX.Element | null;
  options: (CometChatActionsIcon | CometChatActionsView)[];
  alignment: MessageBubbleAlignment;
  topMenuSize?: number,
  type?: string,
  category?: string,
};
/**
 * React component for displaying different types of messages in the message list.
 * @param props
 * @returns
 */
const CometChatMessageBubble = (props: MessageBubbleProps) => {
  const {
    id,
    leadingView = null,
    headerView = null,
    replyView = null,
    contentView = null,
    bottomView = null,
    threadView = null,
    footerView = null,
    statusInfoView = null,
    options = [],
    alignment = MessageBubbleAlignment.right,
    topMenuSize = 2,
    type, category,
    setRef
  } = props;

  /**Mapping message types and categories to specific class names
   */
  const bubbleTypeMap = {
    [CometChatUIKitConstants.MessageTypes.text + "_" + CometChatUIKitConstants.MessageCategory.message]: "cometchat-message-bubble__text-message",
    [CometChatUIKitConstants.MessageTypes.audio + "_" + CometChatUIKitConstants.MessageCategory.message]: "cometchat-message-bubble__audio-message",
    [CometChatUIKitConstants.MessageTypes.delete + "_" + CometChatUIKitConstants.MessageCategory.action]: "cometchat-message-bubble__delete-message",
    [CometChatUIKitConstants.MessageTypes.file + "_" + CometChatUIKitConstants.MessageCategory.message]: "cometchat-message-bubble__file-message",
    [CometChatUIKitConstants.MessageTypes.groupMember + "_" + CometChatUIKitConstants.MessageCategory.action]: "cometchat-message-bubble__group-message",
    [CometChatUIKitConstants.MessageTypes.image + "_" + CometChatUIKitConstants.MessageCategory.message]: "cometchat-message-bubble__image-message",
    [CometChatUIKitConstants.MessageTypes.video + "_" + CometChatUIKitConstants.MessageCategory.message]: "cometchat-message-bubble__video-message",
    [CollaborativeDocumentConstants.extension_document + "_" + CometChatUIKitConstants.MessageCategory.custom]: "cometchat-message-bubble__document-message",
    [CollaborativeWhiteboardConstants.extension_whiteboard + "_" + CometChatUIKitConstants.MessageCategory.custom]: "cometchat-message-bubble__whiteboard-message",
    [PollsConstants.extension_poll + "_" + CometChatUIKitConstants.MessageCategory.custom]: "cometchat-message-bubble__poll-message",
    [StickersConstants.sticker + "_" + CometChatUIKitConstants.MessageCategory.custom]: "cometchat-message-bubble__sticker-message",
    [CometChatUIKitConstants.MessageTypes.audio + "_" + CometChatUIKitConstants.MessageCategory.call]: "cometchat-message-bubble__audio-call",
    [CometChatUIKitConstants.MessageTypes.video + "_" + CometChatUIKitConstants.MessageCategory.call]: "cometchat-message-bubble__video-call",
    [CometChatUIKitConstants.calls.meeting + "_" + CometChatUIKitConstants.MessageCategory.custom]: "cometchat-message-bubble__meeting-message",
    [CometChatUIKitConstants.MessageTypes.card + "_" + CometChatUIKitConstants.MessageCategory.interactive]: "cometchat-message-bubble__card-message",
    [CometChatUIKitConstants.MessageTypes.customInteractive + "_" + CometChatUIKitConstants.MessageCategory.interactive]: "cometchat-message-bubble__custom-interactive-message",
    [CometChatUIKitConstants.MessageTypes.scheduler + "_" + CometChatUIKitConstants.MessageCategory.interactive]: "cometchat-message-bubble__scheduler-message",
    [CometChatUIKitConstants.MessageTypes.form + "_" + CometChatUIKitConstants.MessageCategory.interactive]: "cometchat-message-bubble__form-message",
  }
  const messageRef = React.useRef<HTMLDivElement>(null);
  const bodyViewRef
  = React.useRef<HTMLDivElement>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const previousHeightRef = useRef<number>(0);
  var timeoutId: NodeJS.Timeout | null = null;
  const intersectionObserver = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    if (messageRef && messageRef.current && setRef) {
      setRef(messageRef);
    }
  }, [messageRef, setRef]);

  const attachIntersectionObserver = useCallback(() => {
    if (!intersectionObserver.current) {
      intersectionObserver.current = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            hideMessageOptions();
          }
        }
      }, { threshold: 0.1 });
      intersectionObserver.current.observe(messageRef.current!);
    }
  }, []);

    /** 
     * Function to attach ResizeObserver to listen for height changes of text buble.
    */
  const attachObserver = useCallback(() => {
    if (bodyViewRef.current && !resizeObserver.current) {
      resizeObserver.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newHeight = entry.contentRect.height;
          if (previousHeightRef.current != newHeight) {
            if(previousHeightRef.current > newHeight){
              hideMessageOptions();
            }
            previousHeightRef.current = newHeight;
          }
        }
      });
      resizeObserver.current.observe(bodyViewRef.current);
    }
  }, []);



  /**
   * Effect to set the message reference when it is available
   *  */
  const [isHovering, setIsHovering] = useState<boolean>(false);
  /**
   * Clean up function to clear the timeout when component unmounts
   */
  useEffect(() => {
   if(CometChatUIKitConstants.MessageTypes.text && CometChatUIKitConstants.MessageCategory.message){
    attachObserver()
   }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
    }
    };
  }, []);
  /** */
  const hideMessageOptions =
    () => {
      timeoutId = setTimeout(() => {
        setIsHovering(false);
        if (intersectionObserver.current && messageRef.current) {
          intersectionObserver.current.unobserve(messageRef.current);
          intersectionObserver.current = null;
        }
      }, 150);
    }
  /** */
  const showMessageOptions =
    () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsHovering(true);
      attachIntersectionObserver();
    }
  /** Function to render the leading view based on alignment*/
  const getLeadingView = () => {
    if (leadingView && alignment === MessageBubbleAlignment.left) {
      return (

        <div
          className="cometchat-message-bubble__leading-view"
        >
          {leadingView}
        </div >
      )
    }
  }
  /** Function to render the header view if available*/
  const getHeaderView = () => {
    if (headerView) {
      return (
        <div className="cometchat-message-bubble__header-view">
          {headerView}
        </div>
      )
    }
  }
  /** Function to handle when an option is clicked */
  const onOptionClicked = (data: CometChatActionsIcon | CometChatActionsView | CometChatOption) => {
    setIsHovering(false)
    options.forEach((option) => {
      if (option instanceof CometChatActionsIcon) {
        if (option.id === data?.id && id) {
          option.onClick?.(parseInt(String(id)));
        }
      }
    });
  }
  /** Function to render the message options if they exist and the user is hovering */
  const getMessageOptions = () => {
    const visibilityStyles = isHovering
      ? { opacity: 1, pointerEvents: 'auto' as const }
      : { opacity: 0, pointerEvents: 'none' as const };
    var optionHeight = "fit-content";
    if (bodyViewRef.current) {
      const height = bodyViewRef.current.clientHeight;
      optionHeight = `${height}px`;
    }
    let style = { height: optionHeight }
    return (
      <div
        className="cometchat-message-bubble__options"
        style={{
          transition: isHovering ? 'opacity 0.2s ease-in-out' : 'opacity 0s ease-in-out',
          ...visibilityStyles,
          ...(isHovering && (footerView || bottomView || threadView) && style)
        }}
      >
        <CometChatContextMenu
          disableBackgroundInteraction={true}
          useParentContainer={true}
          key={isHovering ? 'hovered' : 'not-hovered'}
          topMenuSize={topMenuSize}
          data={options}
          onOptionClicked={onOptionClicked}
          placement={getPlacementAlignment()}
        />
      </div>
    );
  };

  /** Function to determine the placement of the message options menu */
  const getPlacementAlignment = () => {
    if (isMobile()) {
      return checkBubblePosition();
    }

    return props.alignment === MessageBubbleAlignment.left
      ? Placement.right
      : Placement.left;
  };
  /** Helper function to check if the device is mobile*/
  const isMobile = () => {
    return window.innerWidth <= 768;
  };
  /**  Function to get the CSS class based on the message type and category*/
  const getBubbleTypeClassName = () => {
    let secondaryClass = "";
    if (bubbleTypeMap[type + "_" + category]) {
      secondaryClass = bubbleTypeMap[type + "_" + category];
    }
    else {
      secondaryClass = type + "_" + category;
    }
    if (!type) {
      secondaryClass = "";
    }
    return secondaryClass
  }
  /** Function to get the CSS class based on message alignment */
  const getBubbleClassName = () => {
    let className = "cometchat-message-bubble-outgoing";
    if (alignment == MessageBubbleAlignment.left) {
      className = "cometchat-message-bubble-incoming";
    }
    else if (alignment == MessageBubbleAlignment.center) {
      className = "cometchat-message-bubble-action";
    }
    return className;
  }
  /** Function to check the bubble position and return the appropriate placement*/
  const checkBubblePosition = () => {
    const bubble = messageRef.current;
    if (bubble) {
      const rect = bubble.getBoundingClientRect();
      const isAtTop = rect.top < window.innerHeight / 2;
      const isAtBottom = rect.bottom > window.innerHeight / 2;
      if (isAtTop) {
        return Placement.bottom;
      } else if (isAtBottom) {
        return Placement.top;
      } else {
        return Placement.bottom
      }
    } else {
      return Placement.bottom
    }
  };
  useEffect(() => {
    const handleOverlayClicked = () => {
      setIsHovering(false);
    };

    if (isHovering) {
      window.addEventListener('overlayclick', handleOverlayClicked as EventListener);

    }

    return () => {
      window.removeEventListener('overlayclick', handleOverlayClicked as EventListener);

    };
  }, [isHovering]);


  return (
    <div className="cometchat" style={{
      width: "100%",
      height: "fit-content"
    }}>
      <div className="cometchat-message-bubble__wrapper"
        ref={messageRef}
      >
        {getLeadingView()}
        <div className={`cometchat-message-bubble ${getBubbleClassName()}`} id={String(id)}
        >
          {getHeaderView()}
          <div>
            <div style={{
              display: "flex",
              width: "100%",
              height: "100%",
              background: "inherit"
            }}   onMouseLeave={hideMessageOptions}>
            {options && options.length > 0 ?  getMessageOptions() : null}
              <div
                className="cometchat-message-bubble__body-wrapper"
              >
                <div
                   onMouseEnter={showMessageOptions}
                   onClick={()=>{
                      if(!isHovering){
                        showMessageOptions()
                      }
                   }}
                   ref={bodyViewRef}
                  className={`cometchat-message-bubble__body ${getBubbleTypeClassName()}`}
                >
                  {replyView ? <div className="cometchat-message-bubble__body-reply-view"> {replyView}</div> : null}
                  {contentView ? <div className="cometchat-message-bubble__body-content-view"> {contentView}</div> : null}
                  {statusInfoView ? <div className="cometchat-message-bubble__body-status-info-view"> {statusInfoView}</div> : null}
                </div>
                {bottomView ? <div className="cometchat-message-bubble__body-bottom-view"> {bottomView}</div> : null}
                {footerView ? <div className="cometchat-message-bubble__body-footer-view"> {footerView}</div> : null}
                {threadView ? <div className="cometchat-message-bubble__body-thread-view"> {threadView}</div> : null}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export { CometChatMessageBubble }
