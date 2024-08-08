import { AvatarStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CallLogsStyle, OutgoingCallConfiguration } from "@cometchat/uikit-shared";
import { DatePatterns, TitleAlignment } from "@cometchat/uikit-resources";
interface ICallLogsProps {
    title?: string;
    titleAlignment?: TitleAlignment;
    listItemView?: any;
    subtitleView?: any;
    tailView?: any;
    emptyStateView?: any;
    errorStateView?: any;
    loadingStateView?: any;
    emptyStateText?: string;
    errorStateText?: string;
    loadingIconURL?: string;
    incomingAudioCallIconUrl?: string;
    incomingVideoCallIconUrl?: string;
    outgoingAudioCallIconUrl?: string;
    outgoingVideoCallIconUrl?: string;
    missedAudioCallIconUrl?: string;
    missedVideoCallIconUrl?: string;
    infoIconUrl?: string;
    activeCall?: any;
    callLogRequestBuilder?: any;
    onItemClick?: Function;
    onInfoClick?: Function;
    onError?: Function;
    hideSeparator?: boolean;
    datePattern?: DatePatterns;
    dateSeparatorPattern?: DatePatterns;
    callLogsStyle?: CallLogsStyle;
    avatarStyle?: AvatarStyle;
    listItemStyle?: ListItemStyle;
    outgoingCallConfiguration?: OutgoingCallConfiguration;
}
declare const CometChatCallLogs: (props: ICallLogsProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatCallLogs };
