import { AvatarStyle, ListItemStyle } from "my-cstom-package-lit";
import { CSSProperties, useRef, JSX } from "react";
import { useRefSync } from "../../../CometChatCustomHooks";
import { Hooks } from "./hooks";

interface IListItemProps {
    id? : string,
    avatarURL? : string,
    avatarName? : string,
    statusIndicatorColor? : string | null,
    statusIndicatorIcon? : string,
    title? : string,
    isActive? : boolean,
    subtitleView? : JSX.Element | null,
    tailView? : JSX.Element | null,
    menuView? : JSX.Element | null,
    hideSeparator? : boolean,
    avatarStyle? : AvatarStyle,
    statusIndicatorStyle? : CSSProperties,
    listItemStyle? : ListItemStyle
    onClick? : (customEvent : CustomEvent<{id : string}>) => void,
    subtitleViewClassName? : string,
    tailViewClassName? : string,
    menuViewClassName? : string
};

export function CometChatListItem(props : IListItemProps) {
    const {
        id,
        avatarURL,
        avatarName,
        statusIndicatorColor,
        statusIndicatorIcon,
        title,
        isActive,
        subtitleView,
        tailView,
        menuView,
        hideSeparator,
        avatarStyle,
        statusIndicatorStyle,
        listItemStyle,
        onClick,
        subtitleViewClassName,
        tailViewClassName,
        menuViewClassName
    } = props;

    const ref = useRef<JSX.IntrinsicElements["cometchat-list-item"]>();
    const onListItemClickPropRef = useRefSync(onClick); 

    function getIsActivePropSpreadObject() : {isActive? : true} {
        return isActive ? {isActive} : {};
    }

    function getHideSeparatorPropSpreadObject() : {hideSeparator? : true} {
        return hideSeparator ? {hideSeparator} : {};
    }

    function getClassNamePropSpreadObject(className : string | undefined) : {className? : string} {
        return className != undefined ? {className} : {};
    }

    function getStylePropSpreadObject<T1, T2 extends string>(styleObject : T1, stylePropName : T2) : {T2?: string} {
        return styleObject ? {[stylePropName] : JSON.stringify(styleObject)} : {};
    }

    Hooks({
        ref,
        onListItemClickPropRef
    });

    return (
        <cometchat-list-item
            ref = {ref}
            id = {id}
            avatarURL = {avatarURL}
            avatarName = {avatarName}
            title = {title}
            statusIndicatorColor = {statusIndicatorColor}
            statusIndicatorIcon = {statusIndicatorIcon}
            {...getIsActivePropSpreadObject()}
            {...getHideSeparatorPropSpreadObject()}
            {...getStylePropSpreadObject(avatarStyle, "avatarStyle")}
            {...getStylePropSpreadObject(statusIndicatorStyle, "statusIndicatorStyle")}
            {...getStylePropSpreadObject(listItemStyle, "listItemStyle")}
        >
            {
                subtitleView 
                ? 
                (
                    <div 
                        slot = "subtitleView"
                        {...getClassNamePropSpreadObject(subtitleViewClassName)}
                    >
                        {subtitleView}
                    </div>
                ) 
                : 
                null
            }
            {
                tailView 
                ? 
                (
                    <div 
                        slot = "tailView"
                        {...getClassNamePropSpreadObject(tailViewClassName)}
                    >
                        {tailView}
                    </div>
                ) 
                : 
                null
            }
            {
                menuView 
                ? 
                (
                    <div 
                        slot = "menuView"
                        {...getClassNamePropSpreadObject(menuViewClassName)}
                    >
                        {menuView}
                    </div>
                ) 
                : 
                null
            }
        </cometchat-list-item>
    );
}
