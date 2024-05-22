import { AvatarStyle, BaseStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { MessageHeaderStyle } from '@cometchat/uikit-shared';
interface IMessageHeaderProps {
    avatarStyle?: AvatarStyle;
    statusIndicatorStyle?: BaseStyle;
    messageHeaderStyle?: MessageHeaderStyle;
    listItemStyle?: ListItemStyle;
    subtitleView?: any;
    disableUsersPresence?: boolean;
    disableTyping?: boolean;
    /**
  * @deprecated
  *
  * This property is deprecated as of version 4.3.8 due to newer property 'passwordGroupIcon'. It will be removed in subsequent versions.
  */
    protectedGroupIcon?: string;
    passwordGroupIcon?: string | undefined;
    privateGroupIcon?: string;
    menu?: any;
    user?: CometChat.User;
    group?: CometChat.Group;
    backButtonIconURL?: string;
    hideBackButton?: boolean;
    listItemView?: any;
    onError?: ((error: CometChat.CometChatException) => void) | null;
    onBack?: () => void;
}
export declare const CometChatMessageHeader: (props: IMessageHeaderProps) => import("react/jsx-runtime").JSX.Element;
export {};
