/**
 * useCometChatGroupMembersEvents — UI event subscriptions for the group members list.
 *
 * Subscribes to UI events published by other components and dispatches
 * the appropriate reducer actions to keep the group members list in sync.
 * All events are filtered by the current group's GUID.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import type { CometChatEvent } from '../../context/CometChatEvents.types';
import type { CometChatGroupMembersAction } from './CometChatGroupMembers.reducer';

export interface UseCometChatGroupMembersEventsOptions {
  dispatch: React.Dispatch<CometChatGroupMembersAction>;
  guid: string;
}

export function useCometChatGroupMembersEvents(
  options: UseCometChatGroupMembersEventsOptions
): void {
  const { dispatch, guid } = options;

  useCometChatEvents(
    (event: CometChatEvent) => {
      switch (event.type) {
        case 'ui:group/member-added': {
          if (event.group.getGuid() !== guid) break;

          for (const actionMsg of event.messages) {
            const actionOn = actionMsg.getActionOn();
            if ('getUid' in actionOn) {
              const addedUser = actionOn;
              const member = new CometChat.GroupMember(
                addedUser.getUid(),
                CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT as unknown as CometChat.GroupMemberScope
              );
              member.setName(addedUser.getName());
              member.setAvatar(addedUser.getAvatar());
              member.setStatus(addedUser.getStatus());
              dispatch({ type: 'ADD_MEMBER', member });
            }
          }
          break;
        }

        case 'ui:group/member-kicked': {
          if (event.group.getGuid() !== guid) break;
          dispatch({ type: 'REMOVE_MEMBER', uid: event.user.getUid() });
          break;
        }

        case 'ui:group/member-banned': {
          if (event.group.getGuid() !== guid) break;
          dispatch({ type: 'REMOVE_MEMBER', uid: event.user.getUid() });
          break;
        }

        case 'ui:group/member-scope-changed': {
          if (event.group.getGuid() !== guid) break;
          dispatch({
            type: 'UPDATE_MEMBER_SCOPE',
            uid: event.user.getUid(),
            scope: event.newScope,
          });
          break;
        }

        default:
          break;
      }
    },
    [guid]
  );
}
