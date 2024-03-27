import { CallLogDetailsConfiguration, CallLogsConfiguration, WithDetailsStyle } from '@cometchat/uikit-shared';
interface ICallLogWithDetailsProps {
    isMobileView?: boolean;
    messageText?: string;
    withDetailsStyle?: WithDetailsStyle;
    callLogDetailsConfiguration?: CallLogDetailsConfiguration;
    callLogsConfiguration?: CallLogsConfiguration;
}
declare const CometChatCallLogsWithDetails: {
    (props: ICallLogWithDetailsProps): import("react/jsx-runtime").JSX.Element;
    defaultProps: ICallLogWithDetailsProps;
};
export { CometChatCallLogsWithDetails };
