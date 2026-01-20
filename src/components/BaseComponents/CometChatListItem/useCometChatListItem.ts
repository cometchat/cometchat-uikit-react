import { MouseEvent, useCallback, useEffect, useState } from "react"
import { useCometChatFrameContext } from "../../../context/CometChatFrameContext";
interface ICometChatListItem {
  id?: string;
  onListItemClicked?: (input: { id: string; shiftKey?: boolean; metaKey?: boolean }) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

export const useCometChatListItem = ({
  id = "",
  onListItemClicked = ({id: string = ""}) => {},
  menuRef,
}:ICometChatListItem) => {
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = () => {
    return IframeContext?.iframeDocument || document;
  }
  /* 
      This function is triggered on list item click. 
      It triggers the callback function with the id as input. 
  */
  const listItemClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event && event?.stopPropagation) {
      event.stopPropagation();
    }
    onListItemClicked({ id: id, shiftKey: event?.shiftKey, metaKey: event?.metaKey });
  };

  const showTail = () => {
    setIsHovering(true);
  };

  const hideTail = () => {
    setIsHovering(false);
  };
  useEffect(() => {
    const handleOutsideClick = (event: globalThis.MouseEvent) => {
        if (isHovering && menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsHovering(false)
        }
    };

    if (isHovering) {
        getCurrentDocument().addEventListener("click", handleOutsideClick);
    } else {
        getCurrentDocument().removeEventListener("click", handleOutsideClick);
    }

    return () => getCurrentDocument().removeEventListener("click", handleOutsideClick);
}, [isHovering]);


  return {
    listItemClick,
    isHovering,
    showTail,
    hideTail
  }
}