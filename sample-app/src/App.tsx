import './styles/App.css';
import { useState, useEffect, useCallback } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatProvider,
  CometChatUIKit,
  UIKitSettingsBuilder,
  CometChatLocalize,
} from '@cometchat/chat-uikit-react';

import CometChatLogin from './components/CometChatLogin/CometChatLogin';
import CometChatCredentials from './components/CometChatCredentials/CometChatCredentials';
import { CometChatHome } from './components/CometChatHome/CometChatHome';
import { AppContextProvider } from './context/AppContext';
import { COMETCHAT_CONSTANTS } from './AppConstants';
import { sampleAppTranslations } from './locales';

function getCredentials() {
  const appId = COMETCHAT_CONSTANTS.APP_ID || (localStorage.getItem('appId') ?? '');
  const region = COMETCHAT_CONSTANTS.REGION || (localStorage.getItem('region') ?? '');
  const authKey = COMETCHAT_CONSTANTS.AUTH_KEY || (localStorage.getItem('authKey') ?? '');
  return { appId, region, authKey };
}

function hasCredentials(): boolean {
  const { appId, region, authKey } = getCredentials();
  return !!(appId && region && authKey);
}

interface IAppProps {
  theme?: string;
  locale?: string;
}

function App(props: IAppProps) {
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const [showCredentials, setShowCredentials] = useState<boolean>(!hasCredentials());
  const [isInitialized, setIsInitialized] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (props.theme as 'light' | 'dark') || 'light'
  );

  const locale = props.locale ?? 'en-us';

  // Initialize SDK
  useEffect(() => {
    if (showCredentials) return;
    const { appId, region, authKey } = getCredentials();
    if (!appId || !region || !authKey) return;

    const settings = new UIKitSettingsBuilder()
      .setAppId(appId)
      .setRegion(region)
      .setAuthKey(authKey)
      .subscribePresenceForAllUsers()
      .setCallingEnabled(true)
      .build();

    CometChatUIKit.init(settings)
      .then(user => {
        setIsInitialized(true);
        if (user) {
          setLoggedInUser(user);
        }
      })
      .catch(error => {
        console.error('CometChat init failed:', error);
      });
  }, [showCredentials]);

  // Register sample-app-specific translations once initialized
  useEffect(() => {
    if (!isInitialized) return;
    const sharedInstance = CometChatLocalize.getSharedInstance();
    if (sharedInstance) {
      sharedInstance.addTranslation(sampleAppTranslations);
    }
  }, [isInitialized]);

  useEffect(() => {
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  const handleLoginSuccess = useCallback((user: CometChat.User) => {
    setLoggedInUser(user);
  }, []);

  const handleCredentialsSaved = () => {
    window.location.reload();
  };

  const handleChangeCredentials = () => {
    localStorage.removeItem('region');
    localStorage.removeItem('appId');
    localStorage.removeItem('authKey');
    setShowCredentials(true);
  };

  const handleLogout = async () => {
    await CometChatUIKit.logout();
    setLoggedInUser(null);
  };

  // No credentials — show credentials entry screen
  if (showCredentials) {
    return (
      <CometChatProvider theme={theme} locale={locale}>
        <CometChatCredentials onCredentialsSaved={handleCredentialsSaved} />
      </CometChatProvider>
    );
  }

  // Waiting for init
  if (!isInitialized) {
    return null;
  }

  return (
    <CometChatProvider theme={theme} locale={locale}>
      {loggedInUser ? (
        <AppContextProvider>
          <CometChatHome loggedInUser={loggedInUser} onLogout={handleLogout} />
        </AppContextProvider>
      ) : (
        <CometChatLogin
          onLoginSuccess={handleLoginSuccess}
          onChangeCredentials={handleChangeCredentials}
        />
      )}
    </CometChatProvider>
  );
}

export default App;
