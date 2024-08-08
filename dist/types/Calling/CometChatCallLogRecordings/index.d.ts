import { ListItemStyle } from "@cometchat/uikit-elements";
import { DatePatterns } from "@cometchat/uikit-resources";
import { CallLogRecordingsStyle } from "@cometchat/uikit-shared";
interface ICallLogRecordingsProps {
    title?: string;
    backIconUrl?: string;
    downloadIconUrl?: string;
    hideDownloadButton?: boolean;
    call: any;
    datePattern?: DatePatterns;
    listItemStyle?: ListItemStyle;
    callLogRecordingsStyle?: CallLogRecordingsStyle;
    onBackClick?: Function;
    onItemClick?: Function;
    onDownloadClick?: Function;
    listItemView?: any;
    subtitleView?: any;
    tailView?: any;
}
declare const CometChatCallLogRecordings: (props: ICallLogRecordingsProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatCallLogRecordings };
