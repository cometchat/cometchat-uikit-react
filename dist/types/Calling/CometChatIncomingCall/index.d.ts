import { AvatarStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { IncomingCallStyle } from "@cometchat/uikit-shared";
interface IIncomingCallProps {
    call?: any;
    disableSoundForCalls?: boolean;
    customSoundForCalls?: string;
    onAccept?: Function;
    onDecline?: Function;
    acceptButtonText?: string;
    declineButtonText?: string;
    subtitleView?: any;
    onError?: Function;
    listItemStyle?: ListItemStyle;
    avatarStyle?: AvatarStyle;
    incomingCallStyle?: IncomingCallStyle;
}
declare const CometChatIncomingCall: (props: IIncomingCallProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatIncomingCall };
