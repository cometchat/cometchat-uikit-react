import { RadioButtonStyle } from "my-cstom-package-lit";
import { useRef, JSX } from "react";
import { useRefSync } from "../../../CometChatCustomHooks";
import { Hooks } from "./hooks";

interface IRadioButtonProps {
    name? : string,
    labelText? : string,
    checked? : boolean,
    disabled? : boolean,
    radioButtonStyle? : RadioButtonStyle,
    onChange? : (customEvent : CustomEvent<{checked : true}>) => void
};

export function CometChatRadioButton(props : IRadioButtonProps) {
    const {
        name,
        labelText,
        checked,
        disabled,
        radioButtonStyle,
        onChange
    } = props;

    const ref = useRef<JSX.IntrinsicElements["cometchat-radio-button"]>();
    const onChangePropRef = useRefSync(onChange);

    function getCheckedPropSpreadObject() : {checked? : true} {
        return checked ? {checked} : {};
    }

    function getDisabledPropSpreadObject() : {disabled? : true} {
        return disabled ? {disabled} : {};
    }

    function getStylePropSpreadObject<T1, T2 extends string>(styleObject : T1, stylePropName : T2) : {T2?: string} {
        return styleObject ? {[stylePropName] : JSON.stringify(styleObject)} : {};
    }

    Hooks({
        ref,
        onChangePropRef
    });

    return (
        <cometchat-radio-button 
            ref = {ref}
            name = {name}
            labelText = {labelText}
            {...getCheckedPropSpreadObject()}
            {...getDisabledPropSpreadObject()}
            {...getStylePropSpreadObject(radioButtonStyle, "radioButtonStyle")}
        />
    );
}
