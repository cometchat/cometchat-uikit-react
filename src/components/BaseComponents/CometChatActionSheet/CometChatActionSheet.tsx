import { CometChatActionsView, CometChatMessageComposerAction } from "../../../modals";

interface ActionSheetProps {
    /* array of the action items to be displayed. */
    actions: (CometChatMessageComposerAction | CometChatActionsView)[];
    /* callback which is triggered on click of the action button. */
    onActionItemClick: (action: CometChatMessageComposerAction | CometChatActionsView) => void;
}

/*
    CometChatActionSheet is a composite component used to display a list of action items in required layout format. 
    It accepts an array of action items as input and 'onActionItemClick' callback, which is triggered when any of the action items are clicked.
*/
const CometChatActionSheet = (props: ActionSheetProps) => {
    const {
        actions = [],
        onActionItemClick = () => { },
    } = props;

    return (
        <div className="cometchat" style={{
            height: "inherit",
            width: "max-content"
        }}>
           <div className="cometchat-action-sheet">
                {actions?.map((action: CometChatMessageComposerAction | CometChatActionsView,index) => {
                    return <div className="cometchat-action-sheet__item" key={ `cometchat-action-sheet__item-${index}`} onClick={() => { onActionItemClick(action) }}>
                        <div
                            className="cometchat-action-sheet__item-icon"
                            style={action.iconURL ? { WebkitMask: `url(${action.iconURL}) center center no-repeat` } : undefined}
                        />
                        <div className="cometchat-action-sheet__item-body"   key={action.title || `action-${index}`}>
                            {action.title!}
                        </div>
                    </div>
                })}
            </div>
        </div>
    )
}

export { CometChatActionSheet };