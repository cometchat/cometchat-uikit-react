import { CSSProperties } from "react";
import { BaseStyle, TabItemStyle } from "@cometchat/uikit-shared";
import { CometChatTabItem, TabAlignment } from "@cometchat/uikit-resources";
import { TabsStyle } from "./TabsStyle";
export declare const TabsWrapperStyle: (tabStyle: BaseStyle | undefined) => CSSProperties;
export declare const ButtonStyle: (style: TabItemStyle, active: boolean, iconURL?: string) => {
    background: string;
    buttonTextFont: string | undefined;
    buttonTextColor: string | undefined;
    buttonIconTint: string | undefined;
    height: string;
    width: string;
    border: string | undefined;
    borderRadius: string | undefined;
    gap: string;
    padding: string;
    justifyContent: string;
};
export declare const getTabListStyle: (tabsStyle: TabsStyle | undefined, tabAlignment: TabAlignment) => CSSProperties;
export declare function getTabContentStyle(tabsStyle: TabsStyle | undefined): CSSProperties;
export declare function tabItemWrapperStyle(): {
    display: string;
    justifyContent: string;
    height: string;
    width: string;
};
export declare const getTabItemStyle: (tabAlignment: TabAlignment | undefined, tab: CometChatTabItem, activeTab: CometChatTabItem | null, placement: string) => CSSProperties;
export declare const TabPaneContentViewStyle: (tabStyle: BaseStyle | undefined) => CSSProperties;
export declare function draggableStyle(): {
    width: string;
    height: string;
    background: string;
};
export declare function tabPaneContentStyle(tab: CometChatTabItem, activeTab: CometChatTabItem | null): {
    display: string;
    height?: undefined;
    width?: undefined;
} | {
    display: string;
    height: string;
    width: string;
};
