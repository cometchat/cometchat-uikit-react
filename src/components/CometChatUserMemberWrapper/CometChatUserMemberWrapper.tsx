import { CometChatUsers } from '../CometChatUsers/CometChatUsers';
import { CometChatGroupMembers } from '../CometChatGroupMembers/CometChatGroupMembers';
import { UserMemberListType } from '../../Enums/Enums';
import { JSX } from "react";

export interface MentionsProps {
  /**
   * Determines the type of list to display - either users or group members.
   * @defaultValue `UserMemberListType.users`
   */
  userMemberListType?: UserMemberListType;

  /**
   * Callback function invoked when a user or group member item is clicked.
   * @param user - The clicked user (CometChat.User) or group member (CometChat.GroupMember)
   * @returns void
   */
  onItemClick?: (user: CometChat.User | CometChat.GroupMember) => void;

  /**
   * A custom view to render each user or group member item in the list.
   * 
   * @param item - An instance of CometChat.User or CometChat.GroupMember to be rendered
   * @returns A JSX element representing the custom item view
   */
  itemView?: (item?: CometChat.User | CometChat.GroupMember) => JSX.Element;

  /**
   * The search keyword used to filter users or group members.
   */
  searchKeyword?: string;

  /**
   * The group instance for which to display group members.
   */
  group?: CometChat.Group;

  /**
   * A custom view to render the subtitle for each user or group member item.
   * @param item - An instance of CometChat.User or CometChat.GroupMember
   * @returns A JSX element representing the custom subtitle view
   */
  subtitleView?: (item?: CometChat.User | CometChat.GroupMember) => JSX.Element;

  /**
   * A request builder to fetch users with custom parameters.
   */
  usersRequestBuilder?: CometChat.UsersRequestBuilder;

  /**
   * Callback function invoked when the list is empty (no users or group members found).
   * 
   * @returns void
   */
  onEmpty?: () => void;

  /**
   * A request builder to fetch group members with custom parameters.
   */
  groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;

  /**
   * Callback function invoked when an error occurs while fetching users or group members.
   * 
   * @returns void
   */
  onError?: () => void;

  /**
   * Controls the visibility of the scrollbar in the list.
   * 
   * @defaultValue `false`
   */
  showScrollbar?: boolean;
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
    showScrollbar = false,
  } = props;

  return (
    <>
      {userMemberListType === UserMemberListType.users && (
        <CometChatUsers
          showScrollbar={showScrollbar}
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
          showScrollbar={showScrollbar}
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
