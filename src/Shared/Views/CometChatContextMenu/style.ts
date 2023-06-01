import { MenuListStyle } from "my-cstom-package-lit";
import { CometChatTheme } from "uikit-resources-lerna";
import {CSSProperties} from 'react';

export const contextMenuStyle = () => {
    return {
        display: "flex",
        position: "relative"
    } as CSSProperties
}

export const topMenuStyle = () => {
    return {
        listStyleType: "none",
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        margin: "0",
        padding: "0",
        border: "1px solid #e8e8e8",
        zIndex: "2",
        borderRadius: "8px"
    } as CSSProperties
}

export const subMenuStyle = (showSubMenu: boolean, theme: CometChatTheme) => {
    return {
        listStyleType: "none",
        display: showSubMenu ? "flex" : "none",
        position: "absolute",
        right: "24px",
        top: "0",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        border: "1px solid #e8e8e8",
        width: "100%",
        zIndex: "3",
        background: theme.palette.getBackground(),
        margin: "0",
        padding: "0",
        borderRadius: "8px"
    } as CSSProperties
}

export const menuItemStyle = () => {
    return {
        background: "transparent",
        padding: "4px 4px"
    }
}

export const moreButtonStyle = (ContextMenuStyle: MenuListStyle) => {
    return {
        background: "transparent",
        border: "none",
        borderRadius: "0",
        buttonIconTint: ContextMenuStyle?.moreIconTint || "",
    }
}

export const menuButtonStyle = (isSubMenu: boolean, menuData: any) => {
    return {
        background: menuData?.backgroundColor || "transparent",
        border: "none",
        borderRadius: "0",
        buttonIconTint: menuData?.iconTint,
        buttonTextFont: menuData?.titleFont,
        buttonTextColor: menuData?.titleColor,
        gap: isSubMenu && menuData?.title && menuData?.iconURL ? "10px" : "0"
    }
}

export const popoverStyle = {
    width: "300px",
    height: "300px"
}