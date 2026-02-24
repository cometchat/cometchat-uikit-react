import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CometChatContextMenu } from "../CometChatContextMenu/CometChatContextMenu";
import { CometChatActionsIcon, CometChatActionsView, CometChatOption } from "../../../modals";
import { MessageBubbleAlignment, Placement } from "../../../Enums/Enums";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { CollaborativeDocumentConstants } from "../../Extensions/CollaborativeDocument/CollaborativeDocumentConstants";
import { CollaborativeWhiteboardConstants } from "../../Extensions/CollaborativeWhiteboard/CollaborativeWhiteboardConstants";
import { PollsConstants } from "../../Extensions/Polls/PollsConstants";
import { StickersConstants } from "../../Extensions/Stickers/StickersConstants";
import { JSX } from 'react';
import { useCometChatFrameContext } from '../../../context/CometChatFrameContext';
import { getLocalizedString } from '../../../resources/CometChatLocalize/cometchat-localize';
import { sendMessageToMobileApp } from '../../../utils/MobileBridge';
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
  includeBottomViewHeight?: boolean;
  options: (CometChatActionsIcon | CometChatActionsView)[];
  alignment: MessageBubbleAlignment;
  topMenuSize?: number,
  type?: string,
  category?: string,
  panelType?: string,
  primaryColor?: string,
  disableSwipeGesture?: boolean;
  senderUid?: string;
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
    includeBottomViewHeight = false,
    options = [],
    alignment = MessageBubbleAlignment.right,
    topMenuSize = 2,
    type, category,
    setRef,
    panelType,
    primaryColor,
    disableSwipeGesture = false,
    senderUid,
  } = props;
  const isPanelMobile = panelType === "mobile";

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
  const IframeContext = useCometChatFrameContext();
  
  // Swipe gesture state
  const swipeStartX = useRef<number>(0);
  const swipeStartY = useRef<number>(0);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const isSwiping = useRef<boolean>(false);
  const swipeThreshold = 80; // Minimum swipe distance to trigger reply
  const mobileOptionsPortalRef = useRef<HTMLElement | null>(null);
  const sheetTouchStartY = useRef<number>(0);
  const sheetOffsetRef = useRef<number>(0);
  const [sheetDragOffset, setSheetDragOffset] = useState<number>(0);

  const getCurrentWindow = useCallback(() => {
    return IframeContext?.iframeWindow || window;
  }, [IframeContext]);
  const getCurrentDocument = useCallback(() => {
    return IframeContext?.iframeDocument || document;
  }, [IframeContext]);
  
  useEffect(() => {
    if (messageRef && messageRef.current && setRef) {
      setRef(messageRef);
    }
  }, [messageRef, setRef]);

  useLayoutEffect(() => {
    const doc = getCurrentDocument();
    if (!doc?.body) return;
    const portal = doc.createElement('div');
    portal.className = 'cometchat-message-bubble__mobile-options-portal';
    doc.body.appendChild(portal);
    mobileOptionsPortalRef.current = portal;
    return () => {
      portal.remove();
      mobileOptionsPortalRef.current = null;
    };
  }, [getCurrentDocument]);

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
  const [hasFocusWithin, setHasFocusWithin] = useState<boolean>(false);
  const [mobileCustomView, setMobileCustomView] = useState<JSX.Element | null>(null);
  const [bubbleAriaLabel, setBubbleAriaLabel] = useState<string>("");

  useEffect(() => {
    if (bodyViewRef.current) {
      const textContent = bodyViewRef.current.textContent?.trim() || "";
      setBubbleAriaLabel(textContent || "Message");
    }
  });
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeMobileOptions = useCallback(() => {
    setIsHovering(false);
    setMobileCustomView(null);
    setSheetDragOffset(0);
    sheetOffsetRef.current = 0;
  }, []);

  // Handle focus events for keyboard accessibility
  const handleFocusIn = useCallback(() => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }
    setHasFocusWithin(true);
  }, []);

  const handleFocusOut = useCallback((e: React.FocusEvent) => {
    // Only hide options if focus is moving outside the message bubble
    // Use a timeout to allow focus to move to another element within the bubble
    focusTimeoutRef.current = setTimeout(() => {
      if (messageRef.current && !messageRef.current.contains(document.activeElement)) {
        setHasFocusWithin(false);
      }
    }, 100);
  }, []);

  // Combined visibility: show options on hover OR focus-within
  const showOptions = isHovering || hasFocusWithin;
  
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
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
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
        setMobileCustomView(null);
        setSheetDragOffset(0);
        sheetOffsetRef.current = 0;
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
      setMobileCustomView(null);
      setSheetDragOffset(0);
      sheetOffsetRef.current = 0;
      setIsHovering(true);
      attachIntersectionObserver();
      if (isPanelMobile) {
        sendMessageToMobileApp({ type: 'BOTTOM_SHEET_OPEN', payload: {} });
      }
    }
  
  /** Handle swipe gesture for reply */
  const handleSwipeStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
    
    if (isPanelMobile) {
      longPressTimeout.current = setTimeout(() => {
        if (!isSwiping.current) {
          showMessageOptions();
        }
      }, 500);
    }
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
    if (disableSwipeGesture) {
      return;
    }
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - swipeStartX.current;
    const deltaY = currentY - swipeStartY.current;
    
    // Detect horizontal swipe (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isSwiping.current = true;
      
      // Clear long press timeout when swiping
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
      
      // Only allow swipe in the correct direction based on alignment
      // For incoming messages (left), swipe right
      // For outgoing messages (right), swipe left
      if (alignment === MessageBubbleAlignment.left && deltaX > 0) {
        setSwipeOffset(Math.min(deltaX, swipeThreshold * 1.5));
      } else if (alignment === MessageBubbleAlignment.right && deltaX < 0) {
        setSwipeOffset(Math.max(deltaX, -swipeThreshold * 1.5));
      }
    }
  };

  const handleSwipeEnd = () => {
    // Clear long press timeout
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    
    if (!disableSwipeGesture) {
      // Trigger reply if swipe threshold is met
      const absSwipeOffset = Math.abs(swipeOffset);
      if (absSwipeOffset >= swipeThreshold && isSwiping.current) {
        triggerReplyAction();
      }
    }
    
    // Reset swipe state
    setSwipeOffset(0);
    isSwiping.current = false;
  };

  const triggerReplyAction = () => {
    // Find the reply option in the options array
    const replyOption = options.find(
      (option) => option.id === CometChatUIKitConstants.MessageOption.replyMessage
    );
    
    if (replyOption && replyOption instanceof CometChatActionsIcon) {
      replyOption.onClick?.(parseInt(String(id)));
    }
  };
  
  /** Handle long press start for mobile */
  const handleTouchStart = () => {
    if (isPanelMobile) {
      longPressTimeout.current = setTimeout(() => {
        showMessageOptions();
      }, 500); // 500ms long press duration
    }
  }
  
  /** Handle touch end/cancel to clear long press timer */
  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
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
    setMobileCustomView(null);
    options.forEach((option) => {
      if (option instanceof CometChatActionsIcon) {
        if (option.id === data?.id && id) {
          option.onClick?.(parseInt(String(id)));
        }
      }
    });
  }

  const handleMobileOptionSelect = useCallback(
    (option: CometChatActionsIcon | CometChatActionsView) => {

      if(panelType == "mobile" && option?.id == "sendMessagePrivately"){
        sendMessageToMobileApp({ type: 'PRIVATE_CHAT', payload: { senderUid: senderUid } });
        return ;
      }

      if (option instanceof CometChatActionsIcon) {
        onOptionClicked(option);
      } else if (option instanceof CometChatActionsView && option.customView) {
        const viewElement = option.customView(() => closeMobileOptions());
        setMobileCustomView(viewElement as any ?? null);
      }
    },
    [closeMobileOptions, onOptionClicked, senderUid]
  );

  const handleSheetTouchStart = useCallback((event: React.TouchEvent) => {
    sheetTouchStartY.current = event.touches[0].clientY;
    sheetOffsetRef.current = 0;
    setSheetDragOffset(0);
  }, []);

  const handleSheetTouchMove = useCallback((event: React.TouchEvent) => {
    const currentY = event.touches[0].clientY;
    const delta = currentY - sheetTouchStartY.current;
    const offset = Math.max(delta, 0);
    sheetOffsetRef.current = offset;
    setSheetDragOffset(offset);
    if (offset > 0) {
      event.stopPropagation();
      event.preventDefault();
    }
  }, []);

  const handleSheetTouchEnd = useCallback(() => {
    if (sheetOffsetRef.current > 120) {
      closeMobileOptions();
    } else {
      setSheetDragOffset(0);
    }
    sheetOffsetRef.current = 0;
  }, [closeMobileOptions]);
  /** Function to render the message options if they exist and the user is hovering or has focus */
  const getMobileOptionsSheet = () => {
    if (!showOptions || !options || options.length === 0) {
      return null;
    }
    const sheetContent = (
      <div
        className="cometchat-message-bubble__mobile-options-backdrop"
        onClick={closeMobileOptions}
        onTouchStart={closeMobileOptions}
      >
        <div
          className="cometchat-message-bubble__mobile-options-sheet"
          onClick={(event) => event.stopPropagation()}
          onTouchStart={(event) => {
            event.stopPropagation();
            handleSheetTouchStart(event);
          }}
          onTouchMove={(event) => {
            event.stopPropagation();
            handleSheetTouchMove(event);
          }}
          onTouchEnd={(event) => {
            event.stopPropagation();
            handleSheetTouchEnd();
          }}
          onTouchCancel={(event) => {
            event.stopPropagation();
            handleSheetTouchEnd();
          }}
          style={{
            transform: sheetDragOffset ? `translateY(${sheetDragOffset}px)` : undefined,
            transition: sheetDragOffset ? 'none' : 'transform 0.25s ease-out',
          }}
        >
          <div className="cometchat-message-bubble__mobile-options-handle" />
          {mobileCustomView ? (
            <div className="cometchat-message-bubble__mobile-options-custom-view">
              {mobileCustomView}
            </div>
          ) : (
            <>
              <div className="cometchat-message-bubble__mobile-options-list">
                {options.map((option, index) => (
                  <button
                    key={`${option.id}-${index}`}
                    type="button"
                    className="cometchat-message-bubble__mobile-options-item"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleMobileOptionSelect(option);
                    }}
                  >
                    {option.iconURL ? (
                      <span
                        className="cometchat-message-bubble__mobile-options-item-icon"
                        style={{
                          WebkitMask: `url(${option.iconURL}) center center no-repeat`,
                          mask: `url(${option.iconURL}) center center no-repeat`,
                          backgroundColor: primaryColor,
                        }}
                      />
                    ) : null}
                    <span className="cometchat-message-bubble__mobile-options-item-title">
                      {option.title}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="cometchat-message-bubble__mobile-options-cancel"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  closeMobileOptions();
                }}
              >
                {getLocalizedString("message_information_close_hover") || "Close"}
              </button>
            </>
          )}
        </div>
      </div>
    );
    if (mobileOptionsPortalRef.current) {
      return createPortal(sheetContent, mobileOptionsPortalRef.current);
    }
    return sheetContent;
  };

  const getMessageOptions = () => {
    if (isPanelMobile) {
      return getMobileOptionsSheet();
    }
    if (!showOptions) {
      return null;
    }
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
          animation: 'cometchat-fade-in 0.2s ease-in-out',
          ...((footerView || (!includeBottomViewHeight && bottomView) || threadView ) && style)
        }}
      >
        <CometChatContextMenu
          disableBackgroundInteraction={true}
          useParentContainer={true}
          key={'hovered'}
          topMenuSize={topMenuSize}
          data={options}
          onOptionClicked={onOptionClicked}
          placement={getPlacementAlignment()}
        />
      </div>
    );
  };
  
  useEffect(() => {
    const handleOverlayClicked = () => {
      closeMobileOptions();
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        closeMobileOptions();
      }
    };

    if (isHovering) {
      getCurrentWindow().addEventListener('overlayclick', handleOverlayClicked as EventListener);
      getCurrentWindow().addEventListener('click', handleClickOutside as EventListener);
      getCurrentWindow().addEventListener('touchstart', handleClickOutside as EventListener);
    }

    return () => {
      getCurrentWindow().removeEventListener('overlayclick', handleOverlayClicked as EventListener);
      getCurrentWindow().removeEventListener('click', handleClickOutside as EventListener);
      getCurrentWindow().removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [isHovering, closeMobileOptions, getCurrentWindow]);

  useEffect(() => {
    const doc = getCurrentDocument();
    if (isPanelMobile && isHovering) {
      doc.body.style.overflow = 'hidden';
      doc.body.style.touchAction = 'none';
    } else {
      doc.body.style.overflow = '';
      doc.body.style.touchAction = '';
    }

    return () => {
      doc.body.style.overflow = '';
      doc.body.style.touchAction = '';
    };
  }, [isHovering, isPanelMobile, getCurrentDocument]);

  /** Function to determine the placement of the message options menu */
  const getPlacementAlignment = () => {
    if (isPanelMobile || isMobile()) {
      return checkBubblePosition();
    }

    return props.alignment === MessageBubbleAlignment.left
      ? Placement.right
      : Placement.left;
  };
  /** Helper function to check if the device is mobile*/
  const isMobile = () => {
    return getCurrentWindow().innerWidth <= 768;
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
      const isAtTop = rect.top < getCurrentWindow().innerHeight / 2;
      const isAtBottom = rect.bottom > getCurrentWindow().innerHeight / 2;
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


  return (
    <div className="cometchat" style={{
      width: "100%",
      height: "fit-content"
    }}>
      <div className="cometchat-message-bubble__wrapper"
        ref={messageRef}
        onFocus={!isPanelMobile ? handleFocusIn : undefined}
        onBlur={!isPanelMobile ? handleFocusOut : undefined}
      >
        {getLeadingView()}
          <div className={`cometchat-message-bubble ${getBubbleClassName()} ${isPanelMobile ? "cometchat-message-bubble__panel-mobile" : ""}`} id={String(id)}
        >
          {getHeaderView()}
          <div>
            <div style={{
              display: "flex",
              width: "100%",
              height: "100%",
              background: "inherit",
              position: "relative"
            }}   onMouseLeave={panelType !== "mobile" ? hideMessageOptions : undefined}>
              
              {/* Swipe reply indicator */}
              {Math.abs(swipeOffset) > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    [alignment === MessageBubbleAlignment.left ? "left" : "right"]: "10px",
                    transform: "translateY(-50%)",
                    opacity: Math.min(Math.abs(swipeOffset) / swipeThreshold, 1),
                    transition: isSwiping.current ? 'none' : 'opacity 0.2s ease-out',
                    fontSize: "20px",
                    pointerEvents: "none",
                  }}
                >
                  ⤶
                </div>
              )}
              
              <div
                className="cometchat-message-bubble__body-wrapper"
                style={{
                  transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
                  transition: isSwiping.current ? 'none' : 'transform 0.2s ease-out',
                }}
              >
                <div
                   onMouseEnter={panelType !== "mobile" ? showMessageOptions : undefined}
                   onTouchStart={panelType === "mobile" ? handleSwipeStart : handleTouchStart}
                   onTouchMove={panelType === "mobile" ? handleSwipeMove : undefined}
                   onTouchEnd={panelType === "mobile" ? handleSwipeEnd : handleTouchEnd}
                   onTouchCancel={panelType === "mobile" ? handleSwipeEnd : handleTouchEnd}
                   onClick={()=>{
                    if(panelType == "mobile") return;
                      if(!isHovering){
                        showMessageOptions()
                      }
                   }}
                   ref={bodyViewRef}
                   tabIndex={0}
                   aria-label={bubbleAriaLabel}
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
              {options && options.length > 0 ? getMessageOptions() : null}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export { CometChatMessageBubble }
