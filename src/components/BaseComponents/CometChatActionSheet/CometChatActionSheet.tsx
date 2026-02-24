import { useEffect, useRef } from "react";
import {
  CometChatActionsView,
  CometChatMessageComposerAction,
} from "../../../modals";

interface ActionSheetProps {
  /* array of the action items to be displayed. */
  actions: (CometChatMessageComposerAction | CometChatActionsView)[];
  /* callback which is triggered on click of the action button. */
  onActionItemClick: (
    action: CometChatMessageComposerAction | CometChatActionsView,
  ) => void;
  /* callback which is triggered when the action sheet should close. */
  onClose?: () => void;
}

/*
    CometChatActionSheet is a composite component used to display a list of action items in required layout format. 
    It accepts an array of action items as input and 'onActionItemClick' callback, which is triggered when any of the action items are clicked.
*/
const CometChatActionSheet = (props: ActionSheetProps) => {
  const { actions = [], onActionItemClick = () => {}, onClose } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus first menu item on mount
    const firstItem = containerRef.current?.querySelector(
      ".cometchat-action-sheet__item",
    ) as HTMLElement;
    firstItem?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const items = containerRef.current?.querySelectorAll(
      ".cometchat-action-sheet__item",
    ) as NodeListOf<HTMLElement>;

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        onClose?.();
        break;
      case "ArrowDown":
        e.preventDefault();
        items[(index + 1) % items.length]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        items[(index - 1 + items.length) % items.length]?.focus();
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          items[(index - 1 + items.length) % items.length]?.focus();
        } else {
          items[(index + 1) % items.length]?.focus();
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onActionItemClick(actions[index]);
        break;
    }
  };

  return (
    <div
      className='cometchat'
      style={{
        height: "inherit",
        width: "max-content",
      }}
    >
      <div className='cometchat-action-sheet' role='menu' ref={containerRef}>
        {actions?.map(
          (
            action: CometChatMessageComposerAction | CometChatActionsView,
            index,
          ) => {
            return (
              <div
                className='cometchat-action-sheet__item'
                key={`cometchat-action-sheet__item-${index}`}
                role='menuitem'
                tabIndex={0}
                aria-label={action.title}
                onClick={() => {
                  onActionItemClick(action);
                }}
                onKeyDown={(e) => handleKeyDown(e, index)}
              >
                <div
                  className='cometchat-action-sheet__item-icon'
                  style={
                    action.iconURL
                      ? {
                          WebkitMask: `url(${action.iconURL}) center center no-repeat`,
                        }
                      : undefined
                  }
                />
                <div
                  className='cometchat-action-sheet__item-body'
                  key={action.title || `action-${index}`}
                >
                  {action.title!}
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
};

export { CometChatActionSheet };
