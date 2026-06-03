/**
 * useCometChatUsersEvents — UI event subscriptions for the users list.
 *
 * Subscribes to UI events published by other components (user details, etc.)
 * and dispatches the appropriate reducer actions to keep the users list in sync.
 */
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import type { CometChatEvent } from '../../context/CometChatEvents.types';
import type { CometChatUsersAction } from './CometChatUsers.reducer';

export interface UseCometChatUsersEventsOptions {
  dispatch: React.Dispatch<CometChatUsersAction>;
}

export function useCometChatUsersEvents(options: UseCometChatUsersEventsOptions): void {
  const { dispatch } = options;

  useCometChatEvents((event: CometChatEvent) => {
    switch (event.type) {
      case 'ui:user/blocked': {
        dispatch({ type: 'UPDATE_USER', user: event.user });
        break;
      }

      case 'ui:user/unblocked': {
        dispatch({ type: 'UPDATE_USER', user: event.user });
        break;
      }

      default:
        break;
    }
  }, []);
}
