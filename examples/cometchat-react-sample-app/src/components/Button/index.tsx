import { CSSProperties, useRef } from "react";
import { useRefSync } from "../../custom-hooks";
import { Effects } from "./effects";

export type ButtonStyle = {
    buttonTextFont? : string,
    buttonTextColor? : string,
    buttonIconTint? : string
} & CSSProperties;

interface IButtonProps {
    text? : string,
    hoverText? : string,
    iconURL? : string,
    disabled? : boolean,
    buttonStyle? : ButtonStyle,
    onClick? : (customEvent : CustomEvent<{event : PointerEvent}>) => void 
};

export function Button(props : IButtonProps) {
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

    Effects({
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
