import { RadioButtonStyle } from "@cometchat/uikit-elements";
interface IRadioButtonProps {
    name?: string;
    labelText?: string;
    checked?: boolean;
    disabled?: boolean;
    radioButtonStyle?: RadioButtonStyle;
    onChange?: (customEvent: CustomEvent<{
        checked: true;
    }>) => void;
}
export declare function CometChatRadioButton(props: IRadioButtonProps): import("react/jsx-runtime").JSX.Element;
export {};
