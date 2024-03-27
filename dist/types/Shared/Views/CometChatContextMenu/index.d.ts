import { CometChatActionsIcon, CometChatActionsView, Placement } from "@cometchat/uikit-resources";
import { MenuListStyle } from '@cometchat/uikit-elements';
interface ContextMenuProps {
    data: Array<CometChatActionsIcon | CometChatActionsView>;
    topMenuSize: number;
    moreIconURL: string;
    moreIconHoverText: string;
    ContextMenuStyle: MenuListStyle;
    onOptionClicked: (option: CometChatActionsIcon | CometChatActionsView) => void;
    placement: Placement;
}
export declare const CometChatContextMenu: (props: ContextMenuProps) => import("react/jsx-runtime").JSX.Element;
export {};
