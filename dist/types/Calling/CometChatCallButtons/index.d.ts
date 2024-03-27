import { CallButtonsStyle } from "@cometchat/uikit-shared";
interface ICallButtonsProps {
    user?: CometChat.User;
    group?: CometChat.Group;
    voiceCallIconURL?: string;
    voiceCallIconText?: string;
    voiceCallIconHoverText?: string;
    videoCallIconURL?: string;
    videoCallIconText?: string;
    videoCallIconHoverText?: string;
    callButtonsStyle?: CallButtonsStyle;
    onVoiceCallClick?: Function | undefined;
    onVideoCallClick?: Function | undefined;
    onError?: Function;
}
declare const CometChatCallButtons: {
    (props: ICallButtonsProps): import("react/jsx-runtime").JSX.Element;
    defaultProps: ICallButtonsProps;
};
export { CometChatCallButtons };
