import { CallButtonsStyle } from "@cometchat/uikit-shared";
import { CometChat } from "@cometchat/chat-sdk-javascript";
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
}
interface ICallButtonsUserProps extends ICallButtonsBaseProps {
    user: CometChat.User;
    group?: CometChat.Group | null;
}
interface ICallButtonsGroupProps extends ICallButtonsBaseProps {
    user?: CometChat.User | null;
    group: CometChat.Group;
}
type ICallButtonsProps = ICallButtonsUserProps | ICallButtonsGroupProps;
declare const CometChatCallButtons: {
    (props: ICallButtonsProps): import("react/jsx-runtime").JSX.Element;
    defaultProps: {
        voiceCallIconURL: string;
        voiceCallIconText: any;
        voiceCallIconHoverText: any;
        videoCallIconURL: string;
        videoCallIconText: any;
        videoCallIconHoverText: any;
        callButtonsStyle: {
            width: string;
            height: string;
            border: string;
            borderRadius: string;
            background: string;
        };
        onVoiceCallClick: undefined;
        onVideoCallClick: undefined;
        onError: (error: CometChat.CometChatException) => void;
    };
};
export { CometChatCallButtons };
