import { OutgoingCallStyle } from "@cometchat/uikit-shared";
import { AvatarStyle } from "@cometchat/uikit-elements";
interface IOutgoingCallProps {
    call: CometChat.Call;
    disableSoundForCalls?: boolean;
    customSoundForCalls?: string;
    declineButtonText?: string;
    declineButtonIconURL?: string;
    customView?: any;
    onError?: Function;
    avatarStyle?: AvatarStyle;
    outgoingCallStyle?: OutgoingCallStyle;
    onCloseClicked?: Function;
}
declare const CometChatOutgoingCall: (props: IOutgoingCallProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatOutgoingCall };
