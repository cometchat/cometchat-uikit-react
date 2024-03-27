import { CheckboxStyle } from "@cometchat/uikit-elements";
interface ICheckboxProps {
    name?: string;
    labelText?: string;
    checked?: boolean;
    disabled?: boolean;
    checkboxStyle?: CheckboxStyle;
    onChange?: (customEvent: CustomEvent<{
        checked: boolean;
    }>) => void;
}
export declare function CometChatCheckbox(props: ICheckboxProps): import("react/jsx-runtime").JSX.Element;
export {};
