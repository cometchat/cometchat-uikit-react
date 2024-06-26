import { AvatarStyle } from "@cometchat/uikit-elements";
import { CometChatTheme, CometChatDetailsTemplate } from "@cometchat/uikit-resources";
import { CallLogDetailsStyle, CallLogHistoryConfiguration, CallLogParticipantsConfiguration, CallLogRecordingsConfiguration } from "@cometchat/uikit-shared";
interface ICallLogDetailsProps {
    title?: string;
    backIconUrl?: string;
    call: any;
    onBackClick?: Function;
    avatarStyle?: AvatarStyle;
    data?: (callLog: any, loggedInUser: CometChat.User, theme: CometChatTheme) => CometChatDetailsTemplate[];
    callLogHistoryConfiguration?: CallLogHistoryConfiguration;
    callLogParticipantsConfiguration?: CallLogParticipantsConfiguration;
    callLogRecordingsConfiguration?: CallLogRecordingsConfiguration;
    callLogDetailsStyle?: CallLogDetailsStyle;
}
declare const CometChatCallLogDetails: {
    (props: ICallLogDetailsProps): import("react/jsx-runtime").JSX.Element;
    defaultProps: ICallLogDetailsProps;
};
export { CometChatCallLogDetails };
