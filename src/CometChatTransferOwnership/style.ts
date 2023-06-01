import { AvatarStyle, LabelStyle, ListItemStyle } from "my-cstom-package-lit";
import { CSSProperties } from "react";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";
import { GroupMembersStyle, TransferOwnershipStyle } from "uikit-utils-lerna";

type ButtonStyle = CSSProperties & {buttonIconTint? : string};

export function transferOwnershipStyle(transferOwnershipStyleObject : TransferOwnershipStyle | null, theme : CometChatTheme) : CSSProperties {
    return {
        boxSizing: "border-box",
        width: transferOwnershipStyleObject?.width || "max(100%, 312px)",
        height: transferOwnershipStyleObject?.height || "100%",
        border: transferOwnershipStyleObject?.border || "none",
        borderRadius: transferOwnershipStyleObject?.borderRadius || "0",
        background: transferOwnershipStyleObject?.background || theme.palette.getBackground(),
        display: "flex",
        flexDirection: "column",
        rowGap: "16px",
        padding: "16px 8px"
    };
}

export function scopeLabelStyle(transferOwnershipStyleObject : TransferOwnershipStyle | null, theme : CometChatTheme) : LabelStyle {
    return new LabelStyle({
        background: "inherit",
        textFont: transferOwnershipStyleObject?.MemberScopeTextFont || fontHelper(theme.typography.subtitle1),
        textColor: transferOwnershipStyleObject?.MemberScopeTextColor || theme.palette.getAccent600()
    });
}

export function transferBtnStyle(transferOwnershipStyleObject : TransferOwnershipStyle | null, theme : CometChatTheme) : ButtonStyle {
    return {
        width: "100%",
        background: theme.palette.getPrimary(),
        padding: "16px",
        color: transferOwnershipStyleObject?.transferButtonTextColor || theme.palette.getAccent900(),
        font: transferOwnershipStyleObject?.transferButtonTextFont || fontHelper(theme.typography.title2),
        display: "flex",
        justifyContent: "center",
        textAlign: "center",
        border: "none",
        borderRadius: "8px"
    };
}

export function btnsWrapperStyle() : CSSProperties {
    return {
        flexShrink: "0",
        display: "flex",
        flexDirection: "column",
        rowGap: "8px"
    };
}

export function cancelBtnStyle(transferOwnershipStyleObject : TransferOwnershipStyle | null, theme : CometChatTheme) : ButtonStyle {
    return {
        width: "100%",
        background: theme.palette.getSecondary(),
        padding: "16px",
        color: transferOwnershipStyleObject?.cancelButtonTextColor || "black",
        font: transferOwnershipStyleObject?.cancelButtonTextFont || fontHelper(theme.typography.title2),
        display: "flex",
        justifyContent: "center",
        textAlign: "center",
        border: "1px solid #e0e0e0",
        borderRadius: "8px"
    };
}  

export function avatarStyle(avatarStyleObject : AvatarStyle | null, theme : CometChatTheme) : AvatarStyle {
    return new AvatarStyle({
        borderRadius: avatarStyleObject?.borderRadius || "24px",
        width: avatarStyleObject?.width || "36px",
        height: avatarStyleObject?.height || "36px",
        border: avatarStyleObject?.border || `1px solid ${theme.palette.getAccent100()}`,
        backgroundColor: avatarStyleObject?.backgroundColor || theme.palette.getAccent700(),
        nameTextColor: avatarStyleObject?.nameTextColor || theme.palette.getAccent900(),
        backgroundSize: avatarStyleObject?.backgroundSize || "cover",
        nameTextFont: avatarStyleObject?.nameTextFont || fontHelper(theme.typography.subtitle1),
        outerViewBorder: avatarStyleObject?.outerViewBorder || "none",
        outerViewBorderSpacing: avatarStyleObject?.outerViewBorderSpacing || "0"
    });
}

export function statusIndicatorStyle(statusIndicatorStyleObject : CSSProperties | null) : CSSProperties {
    const obj = statusIndicatorStyleObject !== null ? statusIndicatorStyleObject : {};
    
    return {
        ...obj,
        width: statusIndicatorStyleObject?.width || "12px",
        height: statusIndicatorStyleObject?.height || "12px",
        border: statusIndicatorStyleObject?.border || "none",
        borderRadius: statusIndicatorStyleObject?.borderRadius || "24px"
    };
}

export function listItemStyle(listItemStyleObject : ListItemStyle | null, groupMemberStyleObject : GroupMembersStyle | null, theme : CometChatTheme) : ListItemStyle {
    return new ListItemStyle({
        height: listItemStyleObject?.height || "45px",
        width: listItemStyleObject?.width || "100%",
        border: listItemStyleObject?.border || "none",
        borderRadius: listItemStyleObject?.borderRadius || "0",
        background: listItemStyleObject?.background || theme.palette.getBackground(),
        activeBackground: listItemStyleObject?.activeBackground || "",
        hoverBackground: listItemStyleObject?.hoverBackground || "",
        separatorColor: listItemStyleObject?.separatorColor || groupMemberStyleObject?.separatorColor || theme.palette.getAccent200(),
        titleFont: listItemStyleObject?.titleFont || fontHelper(theme.typography.title2),
        titleColor:  listItemStyleObject?.titleColor || theme.palette.getAccent()    
    });
}

export function groupMembersStyle(groupMemberStyleObject : GroupMembersStyle |  null, theme : CometChatTheme) : GroupMembersStyle {
    return new GroupMembersStyle({
        height: groupMemberStyleObject?.height || "100%",
        width: groupMemberStyleObject?.width || "100%",
        border: groupMemberStyleObject?.border || "none",
        borderRadius: groupMemberStyleObject?.borderRadius || "0",
        background: groupMemberStyleObject?.background || theme.palette.getBackground(),
        titleTextFont: groupMemberStyleObject?.titleTextFont || fontHelper(theme.typography.title1),
        titleTextColor: groupMemberStyleObject?.titleTextColor || theme.palette.getAccent(),
        emptyStateTextFont: groupMemberStyleObject?.emptyStateTextFont || "",
        emptyStateTextColor: groupMemberStyleObject?.emptyStateTextColor || "",
        errorStateTextFont: groupMemberStyleObject?.errorStateTextFont || "", 
        errorStateTextColor: groupMemberStyleObject?.errorStateTextColor || "", 
        loadingIconTint: groupMemberStyleObject?.loadingIconTint || "",   
        searchIconTint: groupMemberStyleObject?.searchIconTint || "", 
        searchBorder: groupMemberStyleObject?.searchBorder || "", 
        searchBorderRadius: groupMemberStyleObject?.searchBorderRadius || "", 
        searchBackground: groupMemberStyleObject?.searchBackground || "", 
        searchPlaceholderTextFont: groupMemberStyleObject?.searchPlaceholderTextFont || "", 
        searchPlaceholderTextColor: groupMemberStyleObject?.searchPlaceholderTextColor || "", 
        searchTextFont: groupMemberStyleObject?.searchTextFont || "", 
        searchTextColor: groupMemberStyleObject?.searchTextColor || "",
        onlineStatusColor: groupMemberStyleObject?.onlineStatusColor || theme.palette.getSuccess(),
        backButtonIconTint: groupMemberStyleObject?.backButtonIconTint || theme.palette.getPrimary(),
        closeButtonIconTint: groupMemberStyleObject?.closeButtonIconTint || theme.palette.getPrimary(),
        padding: groupMemberStyleObject?.padding || "0",
        separatorColor: groupMemberStyleObject?.separatorColor || theme.palette.getAccent200(),
        boxShadow: groupMemberStyleObject?.boxShadow
    });
}
