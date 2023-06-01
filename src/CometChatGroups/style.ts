import { AvatarStyle, ListItemStyle } from "my-cstom-package-lit";
import { CSSProperties } from "react";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";
import { GroupsStyle } from "uikit-utils-lerna";

export function groupsWrapperStyle(groupsStyleObject : GroupsStyle | undefined, theme : CometChatTheme) : CSSProperties {
    return {
        position: "relative",
        boxSizing: "border-box",
        background: groupsStyleObject?.background || theme.palette.getBackground(),
        width: groupsStyleObject?.width || "100%",
        height: groupsStyleObject?.height || "100%",
        border: groupsStyleObject?.border || `1px solid ${theme.palette.getAccent50()}`,
        borderRadius: groupsStyleObject?.borderRadius || "0",
        overflow: "hidden"
    };
}

export function menusStyle() : CSSProperties {
    return {
        position: "absolute",
        top: "12px",
        right: "12px",
        cursor: "pointer"
    };
}

export function statusIndicatorStyle(statusIndicatorStyleObject : CSSProperties | undefined) : CSSProperties {
    const obj = statusIndicatorStyleObject !== undefined ? statusIndicatorStyleObject : {}; 
    
    return {
        ...obj,
        width: statusIndicatorStyleObject?.width || "12px",
        height: statusIndicatorStyleObject?.height || "12px",
        border: statusIndicatorStyleObject?.border || "none",
        borderRadius: statusIndicatorStyleObject?.borderRadius || "24px"
    };
}

export function avatarStyle(avatarStyleObject : AvatarStyle | undefined, theme : CometChatTheme) : AvatarStyle {
    return new AvatarStyle({
        borderRadius: avatarStyleObject?.borderRadius || "24px",
        width: avatarStyleObject?.width || "28px",
        height: avatarStyleObject?.height || "28px",
        border: avatarStyleObject?.border || `1px solid ${theme.palette.getAccent100()}`,
        backgroundColor: avatarStyleObject?.backgroundColor || theme.palette.getAccent700(),
        nameTextColor: avatarStyleObject?.nameTextColor || theme.palette.getAccent900(),
        backgroundSize: avatarStyleObject?.backgroundSize || "cover",
        nameTextFont: avatarStyleObject?.nameTextFont || fontHelper(theme.typography.caption1),
        outerViewBorder: avatarStyleObject?.outerViewBorder || "",
        outerViewBorderSpacing: avatarStyleObject?.outerViewBorderSpacing || ""
    });
}

export function listItemStyle(listItemStyleObject : ListItemStyle | undefined, groupsStyleObject : GroupsStyle | undefined, theme : CometChatTheme) : ListItemStyle {
    return new ListItemStyle({
        height: listItemStyleObject?.height || "45px",
        width: listItemStyleObject?.width || "100%",
        background: listItemStyleObject?.background || "inherit",
        activeBackground: listItemStyleObject?.activeBackground || theme.palette.getAccent100(),
        borderRadius: listItemStyleObject?.borderRadius || "0",
        titleFont: listItemStyleObject?.titleFont || fontHelper(theme.typography.title2),
        titleColor: listItemStyleObject?.titleColor || theme.palette.getAccent(),
        border: listItemStyleObject?.border || "none",
        separatorColor: listItemStyleObject?.separatorColor || groupsStyleObject?.separatorColor || theme.palette.getAccent200(),
        hoverBackground: listItemStyleObject?.hoverBackground || theme.palette.getAccent50()
    });
}

export function groupsStyle(groupsStyleObject : GroupsStyle | undefined, theme : CometChatTheme) : GroupsStyle {
    return new GroupsStyle({
        background: "inherit",
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: "inherit",
        titleTextFont: groupsStyleObject?.titleTextFont || fontHelper(theme.typography.title1),
        titleTextColor: groupsStyleObject?.titleTextColor || theme.palette.getAccent(),
        searchPlaceholderTextFont: groupsStyleObject?.searchPlaceholderTextFont || fontHelper(theme.typography.subtitle1),
        searchPlaceholderTextColor: groupsStyleObject?.searchPlaceholderTextColor || theme.palette.getAccent500(),
        searchTextFont: groupsStyleObject?.searchTextFont || fontHelper(theme.typography.subtitle1),
        searchTextColor: groupsStyleObject?.searchTextColor || theme.palette.getAccent(),
        searchBorder: groupsStyleObject?.searchBorder || "none",
        searchBorderRadius: groupsStyleObject?.searchBorderRadius || "8px",
        searchBackground: groupsStyleObject?.searchBackground || theme.palette.getAccent50(),
        searchIconTint: groupsStyleObject?.searchIconTint || theme.palette.getAccent500(),
        separatorColor: groupsStyleObject?.separatorColor || theme.palette.getAccent400(),
        loadingIconTint: groupsStyleObject?.loadingIconTint || theme.palette.getAccent600(),
        emptyStateTextFont: groupsStyleObject?.emptyStateTextFont || fontHelper(theme.typography.heading),
        emptyStateTextColor: groupsStyleObject?.emptyStateTextColor || theme.palette.getAccent600(),
        errorStateTextFont: groupsStyleObject?.errorStateTextFont || fontHelper(theme.typography.heading),
        errorStateTextColor: groupsStyleObject?.errorStateTextColor || theme.palette.getAccent600()
    });
}

export function subtitleStyle(groupsStyleObject : GroupsStyle | undefined, theme : CometChatTheme) : CSSProperties {
    return {
        font: groupsStyleObject?.subTitleTextFont || fontHelper(theme.typography.subtitle2),
        color: groupsStyleObject?.subTitleTextColor || theme.palette.getAccent600(),
    };
}
