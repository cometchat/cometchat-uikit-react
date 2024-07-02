import { CallLogHistoryStyle } from "@cometchat/uikit-shared";
import { DatePatterns } from "@cometchat/uikit-resources";
import { ListItemStyle } from "@cometchat/uikit-elements";
interface ICallLogHistoryProps {
    title?: string;
    emptyStateText?: string;
    errorStateText?: string;
    backIconUrl?: string;
    loadingIconURL?: string;
    emptyStateView?: any;
    loadingStateView?: any;
    errorStateView?: any;
    subtitleView?: any;
    tailView?: any;
    callLogRequestBuilder?: any;
    callUser?: any;
    callGroup?: any;
    onItemClick?: Function;
    onBackClick?: Function;
    onError?: Function;
    datePattern?: DatePatterns;
    dateSeparatorPattern?: DatePatterns;
    listItemStyle?: ListItemStyle;
    callLogHistoryStyle?: CallLogHistoryStyle;
}
declare const CometChatCallLogHistory: {
    (props: ICallLogHistoryProps): import("react/jsx-runtime").JSX.Element;
    defaultProps: ICallLogHistoryProps;
};
export { CometChatCallLogHistory };
