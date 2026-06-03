import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit, UIKitSettingsBuilder } from '@cometchat/chat-uikit-react';
import { COMETCHAT_CONSTANTS } from './AppConstants';
import { metaInfo } from './metaInfo';

const getBrowserTheme = (): 'light' | 'dark' => {
  const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return isDarkTheme ? 'dark' : 'light';
};

const appID: string = COMETCHAT_CONSTANTS.APP_ID || (localStorage.getItem('appId') ?? '');
const region: string = COMETCHAT_CONSTANTS.REGION || (localStorage.getItem('region') ?? '');
const authKey: string = COMETCHAT_CONSTANTS.AUTH_KEY || (localStorage.getItem('authKey') ?? '');

export function initCometChat() {
  if (appID && region && authKey) {
    const settings = new UIKitSettingsBuilder()
      .setAppId(appID)
      .setRegion(region)
      .setAuthKey(authKey)
      .subscribePresenceForAllUsers()
      .setCallingEnabled(true)
      .build();

    CometChatUIKit.init(settings).then(() => {
      const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
      root.render(<App theme={getBrowserTheme()}/>);
    });

    try {
      CometChat.setDemoMetaInfo(metaInfo);
    } catch {
      // ignore
    }
  } else {
    const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
    root.render(<App theme={getBrowserTheme()} />);
  }
}

initCometChat();
