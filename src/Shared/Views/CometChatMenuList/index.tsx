import { MenuListStyle } from "my-cstom-package-lit";
import { useRef, JSX } from "react";
import { CometChatOption } from "uikit-resources-lerna";
import { useRefSync } from "../../../CometChatCustomHooks";
import { Hooks } from "./hooks";

interface IMenuListProps {
    data : CometChatOption[],
    moreIconURL? : string,
    topMenuSize? : number,
    menuListStyle? : MenuListStyle,
    onOptionClick? : (customEvent : CustomEvent<{data : CometChatOption}>) => void
};

export function CometChatMenuList(props : IMenuListProps) {
    const {
        data,
        moreIconURL,
        topMenuSize,
        menuListStyle,
        onOptionClick
    } = props;

    const ref = useRef<JSX.IntrinsicElements["cometchat-menu-list"]>();
    const onOptionClickPropRef = useRefSync(onOptionClick);
    let idToOnClickMapRef = useRef<Map<string | undefined, (() => void) | undefined> | null>(null);

    function getStylePropSpreadObject<T1, T2 extends string>(styleObject : T1, stylePropName : T2) : {T2?: string} {
        return styleObject ? {[stylePropName] : JSON.stringify(styleObject)} : {};
    }

    Hooks({
        data,
        idToOnClickMapRef,
        ref,
        onOptionClickPropRef
    });

    return (
        <cometchat-menu-list
            ref = {ref}
            moreIconURL = {moreIconURL}
            topMenuSize = {topMenuSize}
            {...getStylePropSpreadObject(menuListStyle, "menuListStyle")}
            data = {JSON.stringify(data)}
        />
    );
}
