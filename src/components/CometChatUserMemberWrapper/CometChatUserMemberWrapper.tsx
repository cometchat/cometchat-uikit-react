import { CometChatUsers } from '../CometChatUsers/CometChatUsers';
import { CometChatGroupMembers } from '../CometChatGroupMembers/CometChatGroupMembers';
import { UserMemberListType } from '../../Enums/Enums';
import { JSX } from "react";

export interface MentionsProps {
  userMemberListType?: UserMemberListType;
  onItemClick?: (user: CometChat.User | CometChat.GroupMember) => void;
  itemView?: (item?: CometChat.User | CometChat.GroupMember) => JSX.Element;
  searchKeyword?: string;
  group?: CometChat.Group;
  subtitleView?: (item?: CometChat.User | CometChat.GroupMember) => JSX.Element;
  usersRequestBuilder?: CometChat.UsersRequestBuilder;
  onEmpty?: () => void;
  groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  onError?: () => void;
}

export function CometChatUserMemberWrapper(props: MentionsProps) {
  const {
    userMemberListType = UserMemberListType.users,
    onItemClick,
    itemView,
    searchKeyword,
    group,
    subtitleView,
    usersRequestBuilder,
    onEmpty,
    groupMemberRequestBuilder,
    onError,
  } = props;

  return (
    <>
      {userMemberListType === UserMemberListType.users && (
        <CometChatUsers
          hideSearch={true}
          showSectionHeader={false}
          onItemClick={onItemClick}
          searchKeyword={searchKeyword}
          itemView={itemView}
          usersRequestBuilder={usersRequestBuilder}
          subtitleView={subtitleView}
          onEmpty={onEmpty}
          onError={onError}
          disableLoadingState={true}
        />
      )}

      {userMemberListType === UserMemberListType.groupmembers && group && (
        <CometChatGroupMembers
          group={group}
          hideSearch={true}
          groupMemberRequestBuilder={groupMemberRequestBuilder}
          onItemClick={onItemClick}
          searchKeyword={searchKeyword}
          itemView={itemView}
          subtitleView={subtitleView}
          onEmpty={onEmpty}
          trailingView={(entity: CometChat.GroupMember) => { return <></> }}
          onError={onError}
          disableLoadingState={true}
        />
      )}
    </>
  );
}
