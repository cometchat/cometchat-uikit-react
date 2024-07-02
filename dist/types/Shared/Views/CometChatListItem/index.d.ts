import { AvatarStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CSSProperties, JSX } from "react";
import { UserPresencePlacement } from "@cometchat/uikit-resources";
interface IListItemProps {
    id?: string;
    avatarURL?: string;
    avatarName?: string;
    statusIndicatorColor?: string | null;
    statusIndicatorIcon?: string;
    title?: string;
    isActive?: boolean;
    subtitleView?: JSX.Element | null;
    tailView?: JSX.Element | null;
    menuView?: JSX.Element | null;
    hideSeparator?: boolean;
    avatarStyle?: AvatarStyle;
    statusIndicatorStyle?: CSSProperties | null;
    listItemStyle?: ListItemStyle;
    onClick?: (customEvent: CustomEvent<{
        id: string;
    }>) => void;
    subtitleViewClassName?: string;
    tailViewClassName?: string;
    menuViewClassName?: string;
    loadingIconURL?: string;
    userPresencePlacement?: UserPresencePlacement;
}
export declare function CometChatListItem(props: IListItemProps): import("react/jsx-runtime").JSX.Element;
export {};
