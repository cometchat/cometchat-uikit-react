import { AvatarStyle, ListItemStyle } from "my-cstom-package-lit";
import { CSSProperties } from "react";
import { ListStyle, UsersStyle } from "uikit-utils-lerna";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";

export function listStyle(usersStyleObject : UsersStyle | null, theme : CometChatTheme) : ListStyle {
    return new ListStyle({
        width: "100%",
        height: "100%",
        background: "inherit",
        border: "none",
        borderRadius: "inherit",
        titleTextFont: usersStyleObject?.titleTextFont || fontHelper(theme.typography.title1),
        titleTextColor: usersStyleObject?.titleTextColor || theme.palette.getAccent(),
        searchPlaceholderTextFont: usersStyleObject?.searchPlaceholderTextFont || fontHelper(theme.typography.subtitle1),
        searchPlaceholderTextColor: usersStyleObject?.searchPlaceholderTextColor || theme.palette.getAccent500(),
        searchTextFont: usersStyleObject?.searchTextFont || fontHelper(theme.typography.subtitle1),
        searchTextColor: usersStyleObject?.searchTextColor || theme.palette.getAccent(),
        searchBorder: usersStyleObject?.searchBorder || "none",
        searchBorderRadius: usersStyleObject?.searchBorderRadius || "8px",
        searchBackground: usersStyleObject?.searchBackground || theme.palette.getAccent50(),
        searchIconTint: usersStyleObject?.searchIconTint || theme.palette.getAccent500(),
        separatorColor: usersStyleObject?.separatorColor || theme.palette.getAccent400(),
        loadingIconTint: usersStyleObject?.loadingIconTint || theme.palette.getAccent600(),
        emptyStateTextFont: usersStyleObject?.emptyStateTextFont || fontHelper(theme.typography.heading),
        emptyStateTextColor: usersStyleObject?.emptyStateTextColor || theme.palette.getAccent600(),
        errorStateTextFont: usersStyleObject?.errorStateTextFont || fontHelper(theme.typography.heading),
        errorStateTextColor: usersStyleObject?.errorStateTextColor || theme.palette.getAccent600(),
        sectionHeaderTextFont: usersStyleObject?.sectionHeaderTextFont || fontHelper(theme.typography.caption1),
        sectionHeaderTextColor: usersStyleObject?.sectionHeaderTextColor || theme.palette.getAccent500()
    });
}

export function UsersWrapperStyle(usersStyleObject : UsersStyle | null, theme : CometChatTheme) : CSSProperties {
    return {
        boxSizing: "border-box",
        position: "relative",
        width: usersStyleObject?.width || "100%",
        height: usersStyleObject?.height || "100%",
        background: usersStyleObject?.background || theme.palette.getBackground(),
        border: usersStyleObject?.border || `1px solid ${theme.palette.getAccent50()}`,
        borderRadius: usersStyleObject?.borderRadius || "0",
        overflow: "hidden"
    };
}

export function menuStyles() : CSSProperties {
    return {
        position: "absolute",
        top: "12px",
        right: "12px"
    };
}

export function listItemStyle(listItemStyleObject : ListItemStyle | null, usersStyleObject : UsersStyle | null, theme : CometChatTheme) : ListItemStyle {
    return new ListItemStyle({
        height: listItemStyleObject?.height || "45px",
        width: listItemStyleObject?.width || "100%",
        background: listItemStyleObject?.background || "inherit",
        activeBackground: listItemStyleObject?.activeBackground || theme.palette.getAccent100(),
        borderRadius: listItemStyleObject?.borderRadius || "0",
        titleFont: listItemStyleObject?.titleFont || fontHelper(theme.typography.title2),
        titleColor: listItemStyleObject?.titleColor || theme.palette.getAccent(),
        border: listItemStyleObject?.border || "none",
        separatorColor: listItemStyleObject?.separatorColor || usersStyleObject?.separatorColor || theme.palette.getAccent200(),
        hoverBackground: listItemStyleObject?.hoverBackground || theme.palette.getAccent50()
    });
}

export function avatarStyle(avatarStyleObject : AvatarStyle | null, theme : CometChatTheme) : AvatarStyle {
    return new AvatarStyle({
        borderRadius: avatarStyleObject?.borderRadius || "24px",
        width: avatarStyleObject?.width || "28px",
        height: avatarStyleObject?.height || "28px",
        border: avatarStyleObject?.border || `1px solid ${theme.palette.getAccent100()}`,
        backgroundColor: avatarStyleObject?.backgroundColor || theme.palette.getAccent700(),
        nameTextColor: avatarStyleObject?.nameTextColor || theme.palette.getAccent900(),
        backgroundSize: avatarStyleObject?.backgroundSize || "cover",
        nameTextFont: avatarStyleObject?.nameTextFont || fontHelper(theme.typography.subtitle1),
        outerViewBorder: avatarStyleObject?.outerViewBorder || "none",
        outerViewBorderSpacing: avatarStyleObject?.outerViewBorderSpacing || "0px"
    });
}

export function statusIndicatorStyle(statusIndicatorStyleObject : CSSProperties | null) : CSSProperties {
    const obj = statusIndicatorStyleObject !== null ? statusIndicatorStyleObject : {};
    
    return {
        ...obj,
        border: statusIndicatorStyleObject?.border || "none",
        borderRadius: statusIndicatorStyleObject?.borderRadius || "24px",
        height: statusIndicatorStyleObject?.height || "12px",
        width: statusIndicatorStyleObject?.width || "12px"
    };
}

export function tailViewSelectionContainerStyle() : CSSProperties {
    return {
        paddingRight: "8px"
    };
}
