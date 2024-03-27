import { MenuListStyle } from "@cometchat/uikit-elements";
import { CometChatOption } from "@cometchat/uikit-resources";
interface IMenuListProps {
    data: CometChatOption[];
    moreIconURL?: string;
    topMenuSize?: number;
    menuListStyle?: MenuListStyle;
    onOptionClick?: (customEvent: CustomEvent<{
        data: CometChatOption;
    }>) => void;
}
export declare function CometChatMenuList(props: IMenuListProps): import("react/jsx-runtime").JSX.Element;
export {};
