import { CheckboxStyle } from "my-cstom-package-lit";
import { useRef, JSX } from "react";
import { useRefSync } from "../../../CometChatCustomHooks";
import { Hooks } from "./hooks";

interface ICheckboxProps {
    name? : string,
    labelText? : string,
    checked? : boolean,
    disabled? : boolean,
    checkboxStyle? : CheckboxStyle,
    onChange? : (customEvent : CustomEvent<{checked : boolean}>) => void
};

export function CometChatCheckbox(props : ICheckboxProps) {
    const {
        name,
        labelText,
        checked,
        disabled,
        checkboxStyle,
        onChange
    } = props;

    const ref = useRef<JSX.IntrinsicElements["cometchat-checkbox"]>();
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
        <cometchat-checkbox 
            ref = {ref}
            name = {name}
            labelText = {labelText}
            {...getCheckedPropSpreadObject()}
            {...getDisabledPropSpreadObject()}
            {...getStylePropSpreadObject(checkboxStyle, "checkboxStyle")}
        />
    );
}
