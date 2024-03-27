import { CometChatTheme, TabsVisibility } from "@cometchat/uikit-resources";
import { ContactsStyle, TabItemStyle } from "@cometchat/uikit-shared";
import { CSSProperties } from "react";
import { TabsStyle } from "../Shared/Views/CometChatTabs/TabsStyle";
type ButtonStyle = CSSProperties & {
    buttonIconTint?: string;
};
type HeaderStyle = CSSProperties;
type WrapperStyle = CSSProperties;
type ContentStyle = CSSProperties;
export declare function closeBtnStyle(contactsStyle: ContactsStyle, theme: CometChatTheme): ButtonStyle;
export declare function contactsHeaderStyle(contactsStyle: ContactsStyle, theme: CometChatTheme): HeaderStyle;
export declare function contactsWrapperStyle(contactsStyle: ContactsStyle, theme: CometChatTheme): WrapperStyle;
export declare function getContactsStyle(contactsStyle: ContactsStyle, theme: CometChatTheme): CSSProperties;
export declare function contactsContentStyle(): ContentStyle;
export declare function getTabsStyle(): TabsStyle;
export declare const getTabItemStyling: (theme: CometChatTheme, tabVisibility: TabsVisibility | undefined, isActive: boolean) => TabItemStyle;
export {};
