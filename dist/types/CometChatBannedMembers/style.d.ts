import { AvatarStyle, ListItemStyle, MenuListStyle } from "@cometchat/uikit-elements";
import { BannedMembersStyle, ListStyle } from "@cometchat/uikit-shared";
import { CometChatTheme } from "@cometchat/uikit-resources";
import { CSSProperties } from "react";
type ButtonStyle = CSSProperties & {
    buttonIconTint: string;
};
export declare function bannedMembersWrapperStyle(bannedMemberStyleObject: BannedMembersStyle | null, theme: CometChatTheme): CSSProperties;
export declare function listStyle(bannedMemberStyleObject: BannedMembersStyle | null, theme: CometChatTheme): ListStyle;
export declare function menusContainerStyle(): CSSProperties;
export declare function statusIndicatorStyle(statusIndicatorStyleObject: CSSProperties | null): CSSProperties;
export declare function avatarStyle(avatarStyleObject: AvatarStyle | null, theme: CometChatTheme): AvatarStyle;
export declare function listItemStyle(listItemStyleObject: ListItemStyle | null, bannedMemberStyleObject: BannedMembersStyle | null, theme: CometChatTheme): ListItemStyle;
export declare function defaultBackBtnStyle(bannedMemberStyleObject: BannedMembersStyle | null, theme: CometChatTheme): ButtonStyle;
export declare function closeBtnStyle(bannedMemberStyleObject: BannedMembersStyle | null, theme: CometChatTheme): ButtonStyle;
export declare function unbanBtnStyle(bannedMemberStyleObject: BannedMembersStyle | null, theme: CometChatTheme): ButtonStyle;
export declare function menuListStyle(theme: CometChatTheme): MenuListStyle;
export declare function listWrapperStyle(): CSSProperties;
export {};
