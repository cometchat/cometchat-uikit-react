import { CallLogParticipantsStyle } from "@cometchat/uikit-shared";
import { AvatarStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { DatePatterns } from "@cometchat/uikit-resources";
interface ICallLogParticipantsProps {
    title?: string;
    backIconUrl?: string;
    call: any;
    datePattern?: DatePatterns;
    avatarStyle?: AvatarStyle;
    listItemStyle?: ListItemStyle;
    callLogParticipantsStyle?: CallLogParticipantsStyle;
    listItemView?: any;
    subtitleView?: any;
    tailView?: any;
    onBackClick?: Function;
    onItemClick?: Function;
}
declare const CometChatCallLogParticipants: {
    (props: ICallLogParticipantsProps): import("react/jsx-runtime").JSX.Element;
    defaultProps: ICallLogParticipantsProps;
};
export { CometChatCallLogParticipants };
