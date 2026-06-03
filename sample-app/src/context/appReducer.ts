import type { CometChat } from '@cometchat/chat-sdk-javascript';

export interface AppState {
  activeTab: string;
  selectedItem: CometChat.Conversation | undefined;
  selectedItemUser: CometChat.User | undefined;
  selectedItemGroup: CometChat.Group | undefined;
  sideComponent: { visible: boolean; type: string };
  threadedMessage: CometChat.BaseMessage | undefined;
  threadGoToMessageId: number | undefined;
  showNewChat: boolean;
  newChat?: {
    user?: CometChat.User;
    group?: CometChat.Group;
  };
  isFreshChat?: boolean;
  goToMessageId?: string;
  showMessagesSearch?: boolean;
  showConversationsSearch?: boolean;
  sideComponentTop?: string;
  threadSearchMessage?: CometChat.BaseMessage;
  searchKeyword?: string;
}

export const defaultAppState: AppState = {
  activeTab: 'chats',
  selectedItem: undefined,
  selectedItemUser: undefined,
  selectedItemGroup: undefined,
  sideComponent: { visible: false, type: '' },
  threadedMessage: undefined,
  threadGoToMessageId: undefined,
  showNewChat: false,
  isFreshChat: false,
  goToMessageId: undefined,
  showMessagesSearch: false,
  showConversationsSearch: false,
  sideComponentTop: 'search',
  threadSearchMessage: undefined,
  searchKeyword: undefined,
};

export type AppAction =
  | { type: 'updateActiveTab'; payload: string }
  | { type: 'updateSelectedItem'; payload: CometChat.Conversation | undefined }
  | { type: 'updateSelectedItemUser'; payload: CometChat.User | undefined }
  | { type: 'updateSelectedItemGroup'; payload: CometChat.Group | undefined }
  | { type: 'updateSideComponent'; payload: { visible: boolean; type: string } }
  | { type: 'updateThreadedMessage'; payload: CometChat.BaseMessage | undefined }
  | { type: 'updateThreadGoToMessageId'; payload: number | undefined }
  | { type: 'showNewChat'; payload: boolean }
  | { type: 'newChat'; payload: { user?: CometChat.User; group?: CometChat.Group } | undefined }
  | { type: 'updateIsFreshChat'; payload: boolean }
  | { type: 'updateGoToMessageId'; payload: string | undefined }
  | { type: 'updateShowMessagesSearch'; payload: boolean }
  | { type: 'updateShowConversationsSearch'; payload: boolean }
  | { type: 'updateSideComponentTop'; payload: string | null }
  | { type: 'updateThreadSearchMessage'; payload: CometChat.BaseMessage | undefined }
  | { type: 'UpdateSearchKeyword'; payload: string | undefined }
  | { type: 'resetAppState' };

export const appReducer = (state: AppState = defaultAppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'updateActiveTab':
      return { ...state, activeTab: action.payload };
    case 'updateSelectedItem':
      return { ...state, selectedItem: action.payload };
    case 'updateSelectedItemUser':
      return { ...state, selectedItemUser: action.payload };
    case 'updateSelectedItemGroup':
      return { ...state, selectedItemGroup: action.payload };
    case 'updateSideComponent':
      return { ...state, sideComponent: action.payload, sideComponentTop: action.payload?.type || '' };
    case 'updateThreadedMessage':
      return { ...state, threadedMessage: action.payload, threadGoToMessageId: undefined };
    case 'updateThreadGoToMessageId':
      return { ...state, threadGoToMessageId: action.payload };
    case 'showNewChat':
      return { ...state, showNewChat: action.payload };
    case 'newChat':
      return { ...state, newChat: action.payload, showNewChat: false };
    case 'updateIsFreshChat':
      return { ...state, isFreshChat: action.payload };
    case 'updateGoToMessageId':
      return { ...state, goToMessageId: action.payload };
    case 'updateShowMessagesSearch':
      return { ...state, showMessagesSearch: action.payload, sideComponentTop: 'search' };
    case 'updateShowConversationsSearch':
      return { ...state, showConversationsSearch: action.payload };
    case 'updateSideComponentTop':
      return { ...state, sideComponentTop: action.payload || '' };
    case 'updateThreadSearchMessage':
      return { ...state, threadSearchMessage: action.payload };
    case 'UpdateSearchKeyword':
      return { ...state, searchKeyword: action.payload };
    case 'resetAppState':
      return defaultAppState;
    default:
      return state;
  }
};
