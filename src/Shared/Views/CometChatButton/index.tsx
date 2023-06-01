import { CSSProperties, useRef, JSX } from "react";
import { useRefSync } from "../../../CometChatCustomHooks";
import { Hooks } from "./hooks";

type ButtonStyle = {
    buttonTextFont? : string,
    buttonTextColor? : string,
    buttonIconTint? : string
} & CSSProperties;

interface ICometChatButtonProps {
    text? : string,
    hoverText? : string,
    iconURL? : string,
    disabled? : boolean,
    buttonStyle? : ButtonStyle,
    onClick? : (customEvent : CustomEvent<{event : PointerEvent}>) => void 
};

export function CometChatButton(props : ICometChatButtonProps) {
    const {
        text,
        hoverText,
        iconURL,
        disabled,
        buttonStyle,
        onClick
    } = props;

    const ref = useRef<JSX.IntrinsicElements["cometchat-button"]>();
    const onClickPropRef = useRefSync(onClick);

    function getDisabledPropSpreadObject() : {disabled? : true} {
        return disabled ? {disabled} : {};
    }

    function getStylePropSpreadObject<T1, T2 extends string>(styleObject : T1, stylePropName : T2) : {T2?: string} {
        return styleObject ? {[stylePropName] : JSON.stringify(styleObject)} : {};
    }

    Hooks({
        ref,
        onClickPropRef
    });

    return (
        <cometchat-button   
            ref = {ref}
            text = {text}
            hoverText = {hoverText}
            iconURL = {iconURL}
            {...getDisabledPropSpreadObject()}
            {...getStylePropSpreadObject(buttonStyle, "buttonStyle")}
        />
    );
}
