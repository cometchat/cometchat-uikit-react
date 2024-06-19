import { CallLogDetailsStyle, CallLogHistoryConfiguration, CallLogParticipantsConfiguration, CallLogRecordingsConfiguration } from "@cometchat/uikit-shared";
import { CometChatDetailsTemplate, CometChatTheme } from "@cometchat/uikit-resources";
import { AvatarStyle } from "@cometchat/uikit-elements";
import { CometChat } from "@cometchat/chat-sdk-javascript";
interface ICallLogDetailsProps {
    title?: string;
    backIconUrl?: string;
    call: CometChat.Call;
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
    defaultProps: {
        title: any;
        backIconUrl: string;
        onBackClick: undefined;
        avatarStyle: AvatarStyle;
        data: (callLog: any, loggedInUser: CometChat.User, theme: CometChatTheme) => CometChatDetailsTemplate[];
        callLogHistoryConfiguration: CallLogHistoryConfiguration;
        callLogParticipantsConfiguration: CallLogParticipantsConfiguration;
        callLogRecordingsConfiguration: CallLogRecordingsConfiguration;
        callLogDetailsStyle: CallLogDetailsStyle;
    };
};
export { CometChatCallLogDetails };
