import { CometChat } from "@cometchat-pro/chat";
import { AvatarStyle, BadgeStyle, BaseStyle, ConfirmDialogStyle, DateStyle, IconStyle, LabelStyle, ListItemStyle, MenuListStyle, ReceiptStyle } from "my-cstom-package-lit";
import { CSSProperties } from "react";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";
import { ConversationsStyle, ListStyle } from "uikit-utils-lerna";

export function conversationsWrapperStyle(conversationsStyleObject : ConversationsStyle | null, theme : CometChatTheme) : CSSProperties {
    return {
        width: conversationsStyleObject?.width || "100%",
        height: conversationsStyleObject?.height || "100%",
        border: conversationsStyleObject?.border || `1px solid ${theme.palette.getAccent400()}`,
        borderRadius: conversationsStyleObject?.borderRadius || "0",
        background: conversationsStyleObject?.background || theme.palette.getBackground(),
        boxShadow: conversationsStyleObject?.boxShadow || "",
        position: "relative",
        boxSizing: "border-box"
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

export function confirmDialogStyle(deleteConversationDialogStyle : ConfirmDialogStyle | null, theme : CometChatTheme) : ConfirmDialogStyle {
    return new ConfirmDialogStyle({
        confirmButtonBackground: deleteConversationDialogStyle?.confirmButtonBackground || theme.palette.getError(),
        cancelButtonBackground: deleteConversationDialogStyle?.cancelButtonBackground || theme.palette.getSecondary(),
        confirmButtonTextColor: deleteConversationDialogStyle?.confirmButtonTextColor || theme.palette.getAccent900("light"),
        confirmButtonTextFont: deleteConversationDialogStyle?.confirmButtonTextFont || fontHelper(theme.typography.text2),
        cancelButtonTextColor: deleteConversationDialogStyle?.cancelButtonTextColor || theme.palette.getAccent900("dark"),
        cancelButtonTextFont: deleteConversationDialogStyle?.cancelButtonTextFont || fontHelper(theme.typography.text2),
        titleFont: deleteConversationDialogStyle?.titleFont || fontHelper(theme.typography.title1),
        titleColor: deleteConversationDialogStyle?.titleColor || theme.palette.getAccent(),
        messageTextFont: deleteConversationDialogStyle?.messageTextFont || fontHelper(theme.typography.subtitle2),
        messageTextColor: deleteConversationDialogStyle?.messageTextColor || theme.palette.getAccent600(),
        background: deleteConversationDialogStyle?.background || theme.palette.getBackground(),
        height: deleteConversationDialogStyle?.height || "auto",
        width: deleteConversationDialogStyle?.width || "auto",
        border: deleteConversationDialogStyle?.border || "none",
        borderRadius: deleteConversationDialogStyle?.borderRadius || "12px",
        boxShadow: deleteConversationDialogStyle?.boxShadow || `0 0 1px 1px ${theme.palette.getAccent50()}`
    });
}

export function listStyle(conversationsStyleObject : ConversationsStyle | null, theme : CometChatTheme) : ListStyle {
    return new ListStyle({
        background: "inherit",
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: "inherit",
        titleTextFont: conversationsStyleObject?.titleTextFont || fontHelper(theme.typography.title1),
        titleTextColor: conversationsStyleObject?.titleTextColor || theme.palette.getAccent(),
        separatorColor: conversationsStyleObject?.separatorColor || theme.palette.getAccent400(),
        loadingIconTint: conversationsStyleObject?.loadingIconTint || theme.palette.getAccent600(),
        emptyStateTextFont: conversationsStyleObject?.emptyStateTextFont || fontHelper(theme.typography.heading),
        emptyStateTextColor: conversationsStyleObject?.emptyStateTextColor || theme.palette.getAccent600(),
        errorStateTextFont: conversationsStyleObject?.errorStateTextFont || fontHelper(theme.typography.heading),
        errorStateTextColor: conversationsStyleObject?.errorStateTextColor || theme.palette.getAccent600()
    });
}

export function avatarStyle(avatarStyleObject : AvatarStyle | null, theme : CometChatTheme) : AvatarStyle {
    return new AvatarStyle({
        width: avatarStyleObject?.width || "36px",
        height: avatarStyleObject?.height || "36px",
        borderRadius: avatarStyleObject?.borderRadius || "24px",
        border: avatarStyleObject?.border || `1px solid ${theme.palette.getAccent100()}`,
        backgroundColor: avatarStyleObject?.backgroundColor || theme.palette.getAccent700(),
        nameTextColor: avatarStyleObject?.nameTextColor || theme.palette.getAccent900(),
        nameTextFont: avatarStyleObject?.nameTextFont || fontHelper(theme.typography.subtitle1),
        backgroundSize: avatarStyleObject?.backgroundSize || "cover",
        outerViewBorder: avatarStyleObject?.outerViewBorder || "",
        outerViewBorderSpacing: avatarStyleObject?.outerViewBorderSpacing || ""
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

export function listItemStyle(listItemStyleObject : ListItemStyle | null, conversationsStyleObject : ConversationsStyle | null, theme : CometChatTheme) : ListItemStyle {
    return new ListItemStyle({
        height: listItemStyleObject?.height || "auto",
        width: listItemStyleObject?.width || "100%",
        background: listItemStyleObject?.background || "inherit",
        activeBackground: listItemStyleObject?.activeBackground || theme.palette.getAccent100(),
        borderRadius: listItemStyleObject?.borderRadius || "0",
        titleFont: listItemStyleObject?.titleFont || fontHelper(theme.typography.title2),
        titleColor: listItemStyleObject?.titleColor || theme.palette.getAccent(),
        border: listItemStyleObject?.border || "none",
        separatorColor: listItemStyleObject?.separatorColor || conversationsStyleObject?.separatorColor || theme.palette.getAccent200(),
        hoverBackground: listItemStyleObject?.hoverBackground || theme.palette.getAccent50()
    });
}

export function badgeStyle(badgeStyleObject : BadgeStyle | null, theme : CometChatTheme) : BadgeStyle {
    return new BadgeStyle({
        textFont: badgeStyleObject?.textFont || fontHelper(theme.typography.subtitle2),
        textColor: badgeStyleObject?.textColor || theme.palette.getAccent("dark"),
        background: badgeStyleObject?.background || theme.palette.getPrimary(),
        borderRadius: badgeStyleObject?.borderRadius || "16px",
        width: badgeStyleObject?.width || "24px",
        height: badgeStyleObject?.height || "auto",
        border: badgeStyleObject?.border || "none"
    });
}

export function itemThreadIndicatorStyle(conversationsStyleObject : ConversationsStyle | null, theme : CometChatTheme) : LabelStyle {
    return new LabelStyle({
        background: "transparent",
        textFont: conversationsStyleObject?.threadIndicatorTextFont || fontHelper(theme.typography.caption2),
        textColor: conversationsStyleObject?.threadIndicatorTextColor || theme.palette.getAccent400()
    });
}

export function iconStyle(theme : CometChatTheme) : IconStyle {
    return new IconStyle({
        width: "24px",
        height: "24px",
        iconTint: theme.palette.getAccent400()
    });
}

export function receiptStyle(receiptStyleObject : ReceiptStyle | null, theme : CometChatTheme) : ReceiptStyle {
    return new ReceiptStyle({
        waitIconTint: receiptStyleObject?.waitIconTint || theme.palette.getAccent700(),
        sentIconTint: receiptStyleObject?.sentIconTint || theme.palette.getAccent600(),
        deliveredIconTint: receiptStyleObject?.deliveredIconTint || theme.palette.getAccent600(),
        readIconTint: receiptStyleObject?.readIconTint || theme.palette.getPrimary(),
        errorIconTint: receiptStyleObject?.errorIconTint || theme.palette.getError()
    });
}

export function subtitleTextStyle(conversation : CometChat.Conversation, typingIndicatorMap : Map<string, CometChat.TypingIndicator>, conversationsStyleObject : ConversationsStyle | null, theme : CometChatTheme) : {font : string, color : string} {
    const convWith = conversation.getConversationWith();
    const id = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
    if (typingIndicatorMap.get(id) !== undefined) {
        return {
            font: conversationsStyleObject?.typingIndictorTextFont || fontHelper(theme.typography.subtitle2),
            color: conversationsStyleObject?.typingIndictorTextColor || theme.palette.getSuccess() || ""
        };
    }

    return {
        font: conversationsStyleObject?.lastMessageTextFont || fontHelper(theme.typography.subtitle2),
        color: conversationsStyleObject?.lastMessageTextColor || theme.palette.getAccent600() || ""
    };
}

export function menuListStyle(theme : CometChatTheme) : MenuListStyle {
    return new MenuListStyle({
        width: "",
        height: "",
        border: "none",
        borderRadius: "8px",
        background: "transparent",
        moreIconTint: "grey",
        submenuWidth: "70px",
        submenuHeight: "20px",
        submenuBorder: "1px solid #e8e8e8",
        submenuBorderRadius: "8px",
        submenuBackground: theme.palette.getBackground()
    });
}

export function dateStyle(dateStyleObject : DateStyle | null, theme : CometChatTheme) : DateStyle {
    const obj = dateStyleObject !== null ? dateStyleObject : {};
    
    return new DateStyle({
        ...obj,
        textFont: dateStyleObject?.textFont || fontHelper(theme.typography.caption2),
        textColor: dateStyleObject?.textColor || theme.palette.getAccent600(),
        background: "transparent"
    });
}

export function subtitleReceiptAndTextContainerStyle() : CSSProperties {
    return {
        display: "flex",
        columnGap: "4px",
        alignItems: "center"
    };
}

export function backdropStyle(backdropStyleObject : BaseStyle | null) : BaseStyle {
    const obj = backdropStyleObject ?? {};
    return {
        ...obj,
        background: backdropStyleObject?.background || "rgba(0, 0, 0, 0.5)"
    };
}

export function defaultSelectionModeNoneTailViewContainerStyle() : CSSProperties {
    return {
        display: "flex", 
        flexDirection: "column", 
        alignItems: "flex-end"
    };
}

export function threadViewStyle() : CSSProperties {
    return {
        display: "flex", 
        columnGap: "4px"
    };
}
