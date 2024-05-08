import { CSSProperties } from 'react';
import { UserMemberListType, UserPresencePlacement } from "@cometchat/uikit-resources";
import { AvatarStyle } from "@cometchat/uikit-elements";
export interface IMentionsProps {
    userMemberListType?: UserMemberListType;
    onItemClick?: (user: CometChat.User | CometChat.GroupMember) => void;
    listItemView?: (item?: CometChat.User | CometChat.GroupMember) => JSX.Element;
    avatarStyle?: AvatarStyle;
    statusIndicatorStyle?: CSSProperties;
    searchKeyword?: string;
    group?: CometChat.Group;
    subtitleView?: (item?: CometChat.User | CometChat.GroupMember) => JSX.Element;
    usersRequestBuilder?: CometChat.UsersRequestBuilder;
    disableUsersPresence?: boolean;
    userPresencePlacement?: UserPresencePlacement;
    hideSeparator?: boolean;
    loadingStateView?: JSX.Element;
    onEmpty?: () => void;
    groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;
    loadingIconUrl?: string;
    disableLoadingState?: boolean;
    onError?: () => void;
}
declare function CometChatUserMemberWrapper(props: IMentionsProps): import("react/jsx-runtime").JSX.Element;
export default CometChatUserMemberWrapper;
