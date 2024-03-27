import { MenuListStyle } from "@cometchat/uikit-elements";
import { CometChatTheme } from "@cometchat/uikit-resources";
import { CSSProperties } from 'react';
export declare const contextMenuStyle: () => CSSProperties;
export declare const topMenuStyle: () => CSSProperties;
export declare const subMenuStyle: (showSubMenu: boolean, theme: CometChatTheme) => CSSProperties;
export declare const menuItemStyle: () => {
    background: string;
    padding: string;
};
export declare const moreButtonStyle: (ContextMenuStyle: MenuListStyle) => {
    background: string;
    border: string;
    borderRadius: string;
    buttonIconTint: string;
};
export declare const menuButtonStyle: (isSubMenu: boolean, menuData: any) => {
    background: any;
    border: string;
    borderRadius: string;
    buttonIconTint: any;
    buttonTextFont: any;
    buttonTextColor: any;
};
export declare const popoverStyle: {
    width: string;
    height: string;
};
