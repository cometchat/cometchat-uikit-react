import { AvatarStyle, LabelStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CometChatTheme } from "@cometchat/uikit-resources";
import { GroupMembersStyle, TransferOwnershipStyle } from "@cometchat/uikit-shared";
import { CSSProperties } from "react";
type ButtonStyle = CSSProperties & {
    buttonIconTint?: string;
};
export declare function transferOwnershipStyle(transferOwnershipStyleObject: TransferOwnershipStyle | null, theme: CometChatTheme): CSSProperties;
export declare function scopeLabelStyle(transferOwnershipStyleObject: TransferOwnershipStyle | null, theme: CometChatTheme, isRadioButton: boolean): LabelStyle;
export declare function transferBtnStyle(transferOwnershipStyleObject: TransferOwnershipStyle | null, theme: CometChatTheme): ButtonStyle;
export declare function btnsWrapperStyle(): CSSProperties;
export declare function cancelBtnStyle(transferOwnershipStyleObject: TransferOwnershipStyle | null, theme: CometChatTheme): ButtonStyle;
export declare function avatarStyle(avatarStyleObject: AvatarStyle | null, theme: CometChatTheme): AvatarStyle;
export declare function statusIndicatorStyle(statusIndicatorStyleObject: CSSProperties | null): CSSProperties;
export declare function listItemStyle(listItemStyleObject: ListItemStyle | null, groupMemberStyleObject: GroupMembersStyle | null, theme: CometChatTheme): ListItemStyle;
export declare function groupMembersStyle(groupMemberStyleObject: GroupMembersStyle | null, theme: CometChatTheme): GroupMembersStyle;
export {};
