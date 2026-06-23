/**
 * useCometChatGroupsEvents — UI event subscriptions for the groups list.
 *
 * Subscribes to UI events published by other components (group members, etc.)
 * and dispatches the appropriate reducer actions to keep the groups list in sync.
 */
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import type { CometChatEvent } from '../../context/CometChatEvents.types';
import type { CometChatGroupsAction } from './CometChatGroups.reducer';

export interface UseCometChatGroupsEventsOptions {
  dispatch: React.Dispatch<CometChatGroupsAction>;
}

export function useCometChatGroupsEvents(options: UseCometChatGroupsEventsOptions): void {
  const { dispatch } = options;

  useCometChatEvents((event: CometChatEvent) => {
    switch (event.type) {
      case 'ui:group/created': {
        dispatch({ type: 'ADD_GROUP', group: event.group });
        break;
      }

      case 'ui:group/deleted': {
        dispatch({ type: 'REMOVE_GROUP', groupId: event.group.getGuid() });
        break;
      }

      case 'ui:group/left': {
        const groupType = event.group.getType();
        if (groupType === 'private') {
          dispatch({ type: 'REMOVE_GROUP', groupId: event.group.getGuid() });
        } else {
          dispatch({ type: 'UPDATE_GROUP', group: event.group });
        }
        break;
      }

      case 'ui:group/member-joined': {
        dispatch({ type: 'UPDATE_GROUP', group: event.joinedGroup });
        break;
      }

      case 'ui:group/member-added': {
        dispatch({ type: 'UPDATE_GROUP', group: event.group });
        break;
      }

      case 'ui:group/member-kicked': {
        dispatch({ type: 'UPDATE_GROUP', group: event.group });
        break;
      }

      case 'ui:group/member-banned': {
        dispatch({ type: 'UPDATE_GROUP', group: event.group });
        break;
      }

      default:
        break;
    }
  }, []);
}
