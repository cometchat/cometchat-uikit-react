import { CSSProperties } from "react";
import { CometChatTheme } from "@cometchat/uikit-resources";
import { AddMembersStyle, UsersStyle } from "@cometchat/uikit-shared";
type ButtonStyle = CSSProperties & {
    buttonIconTint?: string;
};
export declare function addMembersStyle(addMembersStyleObject: AddMembersStyle | null, theme: CometChatTheme): CSSProperties;
export declare function usersStyle(addMembersStyleObject: AddMembersStyle | null, theme: CometChatTheme): UsersStyle;
export declare function addMembersButtonStyle(addMembersStyleObject: AddMembersStyle | null, theme: CometChatTheme): any;
export declare function defaultBackBtnStyle(addMembersStyleObject: AddMembersStyle | null, theme: CometChatTheme): ButtonStyle;
export declare function closeBtnStyle(addMembersStyleObject: AddMembersStyle | null, theme: CometChatTheme): ButtonStyle;
export declare function getAddMembersBtnStyle(): CSSProperties;
export {};
