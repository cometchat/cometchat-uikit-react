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
declare const CometChatCallButtons: (props: ICallButtonsProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatCallButtons };
