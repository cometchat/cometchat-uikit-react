import { CSSProperties } from "react";
type ButtonStyle = {
    buttonTextFont?: string;
    buttonTextColor?: string;
    buttonIconTint?: string;
} & CSSProperties;
interface ICometChatButtonProps {
    text?: string;
    hoverText?: string;
    iconURL?: string;
    disabled?: boolean;
    buttonStyle?: ButtonStyle;
    onClick?: (customEvent: CustomEvent<{
        event: PointerEvent;
    }>) => void;
    childRefCallback?: (ref: React.RefObject<typeof CometChatButton>) => void;
}
export declare function CometChatButton(props: ICometChatButtonProps): import("react/jsx-runtime").JSX.Element;
export {};
