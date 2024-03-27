import { AvatarStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CSSProperties } from "react";
import { CometChatTheme } from "@cometchat/uikit-resources";
import { GroupsStyle } from "@cometchat/uikit-shared";
export declare function groupsWrapperStyle(groupsStyleObject: GroupsStyle | undefined, theme: CometChatTheme): CSSProperties;
export declare function menusStyle(): CSSProperties;
export declare function statusIndicatorStyle(statusIndicatorStyleObject: CSSProperties | undefined): CSSProperties;
export declare function avatarStyle(avatarStyleObject: AvatarStyle | undefined, theme: CometChatTheme): AvatarStyle;
export declare function listItemStyle(listItemStyleObject: ListItemStyle | undefined, groupsStyleObject: GroupsStyle | undefined, theme: CometChatTheme): ListItemStyle;
export declare function groupsStyle(groupsStyleObject: GroupsStyle | undefined, theme: CometChatTheme): GroupsStyle;
export declare function subtitleStyle(groupsStyleObject: GroupsStyle | undefined, theme: CometChatTheme): CSSProperties;