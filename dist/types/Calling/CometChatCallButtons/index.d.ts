import { CallButtonsStyle } from "@cometchat/uikit-shared";
interface ICallButtonsBaseProps {
    voiceCallIconURL?: string;
    voiceCallIconText?: string;
    voiceCallIconHoverText?: string;
    videoCallIconURL?: string;
    videoCallIconText?: string;
    videoCallIconHoverText?: string;
    callButtonsStyle?: CallButtonsStyle;
    onVoiceCallClick?: () => void;
    onVideoCallClick?: () => void;
    onError?: (error: CometChat.CometChatException) => void;
    user?: CometChat.User | null;
    group?: CometChat.Group | null;
}
declare const CometChatCallButtons: (props: ICallButtonsBaseProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatCallButtons };
