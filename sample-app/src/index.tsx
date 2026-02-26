import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { COMETCHAT_CONSTANTS } from './AppConstants';
import { CometChatUIKit, UIKitSettingsBuilder } from '@cometchat/chat-uikit-react';
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { metaInfo } from './metaInfo';
import { setupLocalization } from './utils/utils';

const getBrowserTheme = (): 'light' | 'dark' => {
  const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return isDarkTheme ? 'dark' : 'light';
};

const appID: string = COMETCHAT_CONSTANTS.APP_ID || (localStorage.getItem('appId') ?? ""); // Use the latest appId if available
const region: string = COMETCHAT_CONSTANTS.REGION || (localStorage.getItem('region') ?? ""); // Default to 'us' if region is not found
const authKey: string = COMETCHAT_CONSTANTS.AUTH_KEY || (localStorage.getItem('authKey') ?? ""); // Default authKey if not found

if (appID && region && authKey) {
  const uiKitSettings = new UIKitSettingsBuilder()
    .setAppId(appID)
    .setRegion(region)
    .setAuthKey(authKey)
    .subscribePresenceForAllUsers()
    .build();


// Initialize localization for the sample app and UI Kit.
// Pass a specific language code (e.g., 'en' for English, 'fr' for French) 
// or leave it undefined to use the browser's default language.
setupLocalization();

/*
 * Note:
 * If you need to update the localization strings for a specific language in the UI Kit,
 * use the `CometChatLocalize.init` method. This allows you to override or add custom 
 * translations for a language. Here's an example:
 *
 * CometChatLocalize.init('fr', { 
 *     'fr': { 
 *         "CONTINUE": "Continuer",
 *         "NAME": "Nom",
 *     }
 * });
 *
 * In this example, the French localization is updated with custom strings for "CONTINUE" and "NAME".
 */

  CometChatUIKit.init(uiKitSettings)?.then((response) => {
    console.log('CometChat UI Kit initialized successfully in index.tsx.');
    const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
    root.render(
      <App theme={getBrowserTheme()} />
    );
  });
  try { CometChat.setDemoMetaInfo(metaInfo) } catch (err) { }
} else {
  const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
  root.render(
    <App theme={getBrowserTheme()} />
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
