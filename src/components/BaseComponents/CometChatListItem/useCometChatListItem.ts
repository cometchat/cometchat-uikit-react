import { MouseEvent, useCallback, useEffect, useState } from "react"
interface ICometChatListItem {
  id?: string;
  onListItemClicked?: (input: { id: string }) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

export const useCometChatListItem = ({
  id = "",
  onListItemClicked = ({id: string = ""}) => {},
  menuRef,
}:ICometChatListItem) => {
  const [isHovering, setIsHovering] = useState<boolean>(false);
  /* 
      This function is triggered on list item click. 
      It triggers the callback function with the id as input. 
  */
  const listItemClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event && event?.stopPropagation) {
      event.stopPropagation();
    }
    onListItemClicked({ id: id });
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
        document.addEventListener("click", handleOutsideClick);
    } else {
        document.removeEventListener("click", handleOutsideClick);
    }

    return () => document.removeEventListener("click", handleOutsideClick);
}, [isHovering]);


  return {
    listItemClick,
    isHovering,
    showTail,
    hideTail
  }
}