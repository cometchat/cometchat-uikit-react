import { AvatarStyle, ListItemStyle, MenuListStyle } from "my-cstom-package-lit";
import { CSSProperties } from "react";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";
import { BannedMembersStyle, ListStyle } from "uikit-utils-lerna";

type ButtonStyle = CSSProperties & {buttonIconTint: string};

export function bannedMembersWrapperStyle(bannedMemberStyleObject : BannedMembersStyle | null, theme : CometChatTheme) : CSSProperties {
    return {
        position: "relative",
        height: bannedMemberStyleObject?.height || "100%",
        width: bannedMemberStyleObject?.width || "100%",
        background: bannedMemberStyleObject?.background || theme.palette.getBackground(),
        border: bannedMemberStyleObject?.border || "none",
        borderRadius: bannedMemberStyleObject?.borderRadius || "0",
        boxShadow: bannedMemberStyleObject?.boxShadow || "",
        padding: bannedMemberStyleObject?.padding || "0"
    };
}

export function listStyle(bannedMemberStyleObject : BannedMembersStyle | null, theme : CometChatTheme) : ListStyle {
    return new ListStyle({
        width: "100%",
        height: "100%",
        background: "inherit",
        border: "none",
        borderRadius: "inherit",
        titleTextFont: bannedMemberStyleObject?.titleTextFont || fontHelper(theme.typography.title1),
        titleTextColor: bannedMemberStyleObject?.titleTextColor || theme.palette.getAccent(),
        emptyStateTextFont: bannedMemberStyleObject?.emptyStateTextFont || fontHelper(theme.typography.heading),
        emptyStateTextColor: bannedMemberStyleObject?.emptyStateTextColor || theme.palette.getAccent600(),
        errorStateTextFont: bannedMemberStyleObject?.errorStateTextFont || fontHelper(theme.typography.heading), 
        errorStateTextColor: bannedMemberStyleObject?.errorStateTextColor || theme.palette.getAccent600(), 
        loadingIconTint: bannedMemberStyleObject?.loadingIconTint || theme.palette.getAccent600(),   
        searchIconTint: bannedMemberStyleObject?.searchIconTint || theme.palette.getAccent500(), 
        searchBorder: bannedMemberStyleObject?.searchBorder || "none", 
        searchBorderRadius: bannedMemberStyleObject?.searchBorderRadius || "8px", 
        searchBackground: bannedMemberStyleObject?.searchBackground || theme.palette.getAccent50(), 
        searchPlaceholderTextFont: bannedMemberStyleObject?.searchPlaceholderTextFont || fontHelper(theme.typography.subtitle1), 
        searchPlaceholderTextColor: bannedMemberStyleObject?.searchPlaceholderTextColor || theme.palette.getAccent500(), 
        searchTextFont: bannedMemberStyleObject?.searchTextFont || fontHelper(theme.typography.subtitle1), 
        searchTextColor: bannedMemberStyleObject?.searchTextColor || theme.palette.getAccent(),
        separatorColor: bannedMemberStyleObject?.separatorColor || theme.palette.getAccent400()
    });
}

export function menusContainerStyle() : CSSProperties {
    return {
        position: "absolute",
        right: "12px",
        top: "8px",
        cursor: "pointer"
    };
}

export function statusIndicatorStyle(statusIndicatorStyleObject : CSSProperties | null) : CSSProperties {
    const obj = statusIndicatorStyleObject ? statusIndicatorStyleObject : {};
    
    return {
        ...obj,
        width: statusIndicatorStyleObject?.width || "12px",
        height: statusIndicatorStyleObject?.height || "12px",
        border: statusIndicatorStyleObject?.border || "none",
        borderRadius: statusIndicatorStyleObject?.borderRadius || "24px"
    };
}

export function avatarStyle(avatarStyleObject : AvatarStyle | null, theme : CometChatTheme) : AvatarStyle {
    return new AvatarStyle({
        borderRadius: avatarStyleObject?.borderRadius || "24px",
        width: avatarStyleObject?.width || "36px",
        height: avatarStyleObject?.height || "36px",
        border: avatarStyleObject?.border || "none",
        backgroundColor: avatarStyleObject?.backgroundColor || theme.palette.getAccent700(),
        nameTextColor: avatarStyleObject?.nameTextColor || theme.palette.getAccent900(),
        backgroundSize: avatarStyleObject?.backgroundSize || "cover",
        nameTextFont: avatarStyleObject?.nameTextFont || fontHelper(theme.typography.subtitle1),
        outerViewBorder: avatarStyleObject?.outerViewBorder || "none",
        outerViewBorderSpacing: avatarStyleObject?.outerViewBorderSpacing || "0"
    });
}

export function listItemStyle(listItemStyleObject : ListItemStyle | null, bannedMemberStyleObject : BannedMembersStyle | null, theme : CometChatTheme) : ListItemStyle {
    return new ListItemStyle({
        height: listItemStyleObject?.height || "45px",
        width: listItemStyleObject?.width || "100%",
        border: listItemStyleObject?.border || "none",
        borderRadius: listItemStyleObject?.borderRadius || "0",
        background: listItemStyleObject?.background || theme.palette.getBackground(),
        activeBackground: listItemStyleObject?.activeBackground || "",
        hoverBackground: listItemStyleObject?.hoverBackground || "",
        separatorColor: listItemStyleObject?.separatorColor || bannedMemberStyleObject?.separatorColor || theme.palette.getAccent200(),
        titleFont: listItemStyleObject?.titleFont || fontHelper(theme.typography.title2),
        titleColor:  listItemStyleObject?.titleColor || theme.palette.getAccent()
    });
}

export function defaultBackBtnStyle(bannedMemberStyleObject : BannedMembersStyle | null, theme : CometChatTheme) : ButtonStyle {
    return {
        height: "24px",
        width: "24px",
        border: "none",
        borderRadius: "0",
        buttonIconTint: bannedMemberStyleObject?.backButtonIconTint || theme.palette.getPrimary() || "",
        background: "transparent",
        position: "absolute",
        left: "4px",
        top: "8px"
    };
}

export function closeBtnStyle(bannedMemberStyleObject : BannedMembersStyle| null, theme : CometChatTheme) : ButtonStyle {
    return {
        height: "24px",
        width: "24px",
        border: "none",
        borderRadius: "0",
        buttonIconTint: bannedMemberStyleObject?.closeButtonIconTint || theme.palette.getPrimary() || "",
        background: "transparent",
        position: "absolute",
        right: "12px",
        top: "8px"
    }; 
}

export function unbanBtnStyle(bannedMemberStyleObject : BannedMembersStyle| null, theme : CometChatTheme) : ButtonStyle {
    return {
        border: "none",
        borderRadius: "0",
        buttonIconTint: bannedMemberStyleObject?.unbanIconTint || "rgb(51, 153, 255)",
        background: "transparent"
    }; 
}

export function menuListStyle(theme : CometChatTheme) : MenuListStyle {
    return new MenuListStyle({
        border: "none",
        borderRadius: "8px",
        background: theme.palette.getBackground(),
        moreIconTint: theme.palette.getPrimary(),
        submenuWidth: "100%",
        submenuHeight: "100%",
        submenuBorder: `1px solid ${theme.palette.getAccent200()}`,
        submenuBorderRadius: "8px",
        submenuBackground: theme.palette.getBackground()
    });
}
