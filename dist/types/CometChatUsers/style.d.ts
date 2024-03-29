import { AvatarStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CSSProperties } from "react";
import { ListStyle, UsersStyle } from "@cometchat/uikit-shared";
import { CometChatTheme } from "@cometchat/uikit-resources";
export declare function listStyle(usersStyleObject: UsersStyle | null, theme: CometChatTheme): ListStyle;
export declare function UsersWrapperStyle(usersStyleObject: UsersStyle | null, theme: CometChatTheme): CSSProperties;
export declare function menuStyles(): CSSProperties;
export declare function listItemStyle(listItemStyleObject: ListItemStyle | null, usersStyleObject: UsersStyle | null, theme: CometChatTheme): ListItemStyle;
export declare function avatarStyle(avatarStyleObject: AvatarStyle | null, theme: CometChatTheme): AvatarStyle;
export declare function statusIndicatorStyle(statusIndicatorStyleObject: CSSProperties | null): CSSProperties;
export declare function tailViewSelectionContainerStyle(): CSSProperties;
