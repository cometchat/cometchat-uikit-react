import { AvatarStyle, ChangeScopeStyle, LabelStyle, ListItemStyle, MenuListStyle, ModalStyle } from "my-cstom-package-lit";
import { CSSProperties } from "react";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";
import { GroupMembersStyle, ListStyle } from "uikit-utils-lerna";

type ButtonStyle = CSSProperties & {buttonIconTint?: string};

export function groupMembersWrapperStyle(groupMemberSyleObject : GroupMembersStyle | null, theme : CometChatTheme) : CSSProperties {
    return {
        position: "relative",
        overflowX: "hidden",
        width: groupMemberSyleObject?.width || "100%",
        height: groupMemberSyleObject?.height || "100%",
        boxSizing: "border-box",
        border: groupMemberSyleObject?.border || "none",
        borderRadius: groupMemberSyleObject?.borderRadius || "0",
        background: groupMemberSyleObject?.background || theme.palette.getBackground(),
        padding: groupMemberSyleObject?.padding || "0",
        boxShadow: groupMemberSyleObject?.boxShadow || ""
    };
}

export function listStyle(groupMemberStyleObject : GroupMembersStyle | null, theme : CometChatTheme) : ListStyle {
    return new ListStyle({
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: "inherit",
        background: "inherit",
        titleTextFont: groupMemberStyleObject?.titleTextFont || fontHelper(theme.typography.title1),
        titleTextColor: groupMemberStyleObject?.titleTextColor || theme.palette.getAccent(),
        emptyStateTextFont: groupMemberStyleObject?.emptyStateTextFont || fontHelper(theme.typography.heading),
        emptyStateTextColor: groupMemberStyleObject?.emptyStateTextColor || theme.palette.getAccent600(),
        errorStateTextFont: groupMemberStyleObject?.errorStateTextFont || fontHelper(theme.typography.heading), 
        errorStateTextColor: groupMemberStyleObject?.errorStateTextColor || theme.palette.getAccent600(), 
        loadingIconTint: groupMemberStyleObject?.loadingIconTint || theme.palette.getAccent600(),   
        searchIconTint: groupMemberStyleObject?.searchIconTint || theme.palette.getAccent500(), 
        searchBorder: groupMemberStyleObject?.searchBorder || "none", 
        searchBorderRadius: groupMemberStyleObject?.searchBorderRadius || "8px", 
        searchBackground: groupMemberStyleObject?.searchBackground || theme.palette.getAccent50(), 
        searchPlaceholderTextFont: groupMemberStyleObject?.searchPlaceholderTextFont || fontHelper(theme.typography.subtitle1), 
        searchPlaceholderTextColor: groupMemberStyleObject?.searchPlaceholderTextColor || theme.palette.getAccent500(), 
        searchTextFont: groupMemberStyleObject?.searchTextFont || fontHelper(theme.typography.subtitle1), 
        searchTextColor: groupMemberStyleObject?.searchTextColor || theme.palette.getAccent()
    });
}

export function backBtnContainerStyle() : CSSProperties {
    return {
        position: "absolute",
        left: "4px",
        top: "8px"
    };
}

export function defaultBackBtnStyle(groupMemberStyleObject : GroupMembersStyle | null, theme : CometChatTheme) : ButtonStyle {
    return {
        height: "24px",
        width: "24px",
        border: "none",
        borderRadius: "0",
        buttonIconTint: groupMemberStyleObject?.backButtonIconTint || theme.palette.getPrimary() || "",
        background: "transparent"
    };
}

export function closeBtnStyle(groupMemberStyleObject : GroupMembersStyle | null, theme : CometChatTheme) : ButtonStyle {
    return {
        height: "24px",
        width: "24px",
        border: "none",
        borderRadius: "0",
        buttonIconTint: groupMemberStyleObject?.closeButtonIconTint || theme.palette.getPrimary() || "",
        background: "transparent",
        position: "absolute",
        right: "12px",
        top: "8px"
    }; 
}

export function menusContainerStyle() : CSSProperties {
    return {
        position: "absolute",
        right: "12px",
        top: "8px",
        cursor: "pointer"
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

export function groupScopeStyle(groupScopeStyleObject : ChangeScopeStyle | null, theme : CometChatTheme) : ChangeScopeStyle {
    return new ChangeScopeStyle({
        height: "100%",
        width: "100%",
        borderRadius: "inherit",
        background: "inherit",
        titleTextFont: groupScopeStyleObject?.titleTextFont || fontHelper(theme.typography.title1),
        titleTextColor: groupScopeStyleObject?.titleTextColor || theme.palette.getAccent(),
        activeTextFont: groupScopeStyleObject?.activeTextFont || fontHelper(theme.typography.subtitle1),
        activeTextColor: groupScopeStyleObject?.activeTextColor || theme.palette.getAccent(),
        activeTextBackground: groupScopeStyleObject?.activeTextBackground || theme.palette.getAccent200(),
        arrowIconTint: groupScopeStyleObject?.arrowIconTint || theme.palette.getAccent900(),
        textFont: groupScopeStyleObject?.textFont || fontHelper(theme.typography.subtitle1),
        textColor: groupScopeStyleObject?.textColor || theme.palette.getAccent600(),
        optionBackground: groupScopeStyleObject?.optionBackground || theme.palette.getBackground(),
        optionBorder: groupScopeStyleObject?.optionBorder || "none",
        optionBorderRadius: groupScopeStyleObject?.optionBorderRadius || "0",
        hoverTextFont: groupScopeStyleObject?.hoverTextFont || fontHelper(theme.typography.subtitle1),
        hoverTextColor: groupScopeStyleObject?.hoverTextColor || theme.palette.getAccent900(),
        hoverTextBackground: groupScopeStyleObject?.hoverTextBackground || theme.palette.getAccent100(),
        buttonTextFont: groupScopeStyleObject?.buttonTextFont || fontHelper(theme.typography.title2),
        buttonTextColor: groupScopeStyleObject?.buttonTextColor || theme.palette.getAccent("dark"),
        buttonBackground: groupScopeStyleObject?.buttonBackground || theme.palette.getPrimary(),
        closeIconTint: groupScopeStyleObject?.closeIconTint || theme.palette.getPrimary()
    });
}

export function scopeLabelStyle(groupScopeStyleObject : ChangeScopeStyle | null, theme : CometChatTheme) : LabelStyle {
    return new LabelStyle({
        textFont: groupScopeStyleObject?.textFont || fontHelper(theme.typography.subtitle1),
        textColor: groupScopeStyleObject?.textColor || theme.palette.getAccent600(),
        background: "inherit"
    });
}

export function menuListStyle(theme : CometChatTheme) : MenuListStyle {
    return new MenuListStyle({
        border: "none",
        borderRadius: "8px",
        background: "transparent",
        moreIconTint: theme.palette.getPrimary(),
        submenuWidth: "100%",
        submenuHeight: "100%",
        submenuBorder: `1px solid ${theme.palette.getAccent200()}`,
        submenuBorderRadius: "8px",
        submenuBackground: theme.palette.getBackground()
    });
}

export function modalStyle(groupScopeStyle : ChangeScopeStyle | null, theme : CometChatTheme) : ModalStyle {
    return new ModalStyle({
        height: groupScopeStyle?.height || "212px",
        width: groupScopeStyle?.width || "360px",
        border: groupScopeStyle?.border || `1px solid ${theme.palette.getAccent200()}`,
        borderRadius: groupScopeStyle?.borderRadius || "12px",
        background: groupScopeStyle?.background || theme.palette.getBackground(),
        boxShadow: `0 0 1px ${theme.palette.getAccent600()}`
        /*
        titleFont?: string;
        titleColor?: string;
        closeIconTint?: string;
        */
    });
}

export function listWrapperStyle() : CSSProperties {
    return {
        position: "relative",
        height: "100%"
    };
}

export function tailViewStyle() : CSSProperties {
    return {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        columnGap: "8px"
    };
}
