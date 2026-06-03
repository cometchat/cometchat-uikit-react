import './styles/App.css';
import { useState, useEffect, useMemo } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatThemeProvider,
  CometChatEventsProvider,
  CometChatUIKit,
  LocaleProvider,
  CometChatPluginRegistryContext,
  CometChatPluginRegistry,
  defaultPlugins,
} from '@cometchat/chat-uikit-react';

import { CometChatAIPlugin } from '@cometchat/chat-uikit-react';
import CometChatLogin from './components/CometChatLogin/CometChatLogin';
import CometChatCredentials from './components/CometChatCredentials/CometChatCredentials';
import { CometChatHome } from './components/CometChatHome/CometChatHome';
import { AppContextProvider } from './context/AppContext';
import { COMETCHAT_CONSTANTS } from './AppConstants';
import { createI18nInstance } from './utils/i18n';

const pluginRegistry = new CometChatPluginRegistry([...defaultPlugins, CometChatAIPlugin]);

function hasCredentials(): boolean {
  const appId = COMETCHAT_CONSTANTS.APP_ID || (localStorage.getItem('appId') ?? '');
  const region = COMETCHAT_CONSTANTS.REGION || (localStorage.getItem('region') ?? '');
  const authKey = COMETCHAT_CONSTANTS.AUTH_KEY || (localStorage.getItem('authKey') ?? '');
  return !!(appId && region && authKey);
}

interface IAppProps {
  theme?: string;
  locale?: string;
}

function App(props: IAppProps) {
  // Initialize loggedInUser synchronously from the static getter.
  // By the time App mounts, CometChatUIKit.init() has already completed
  // (index.tsx awaits it before rendering), so the session is already restored.
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(
    () => CometChatUIKit.getLoggedInUser()
  );
  const [showCredentials, setShowCredentials] = useState<boolean>(!hasCredentials());
  const [theme, setTheme] = useState<'light' | 'dark'>((props.theme as 'light' | 'dark') || 'light');

  const locale = props.locale ?? 'en-us';
  const i18nInstance = useMemo(() => createI18nInstance(locale), [locale]);

  useEffect(() => {
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  const handleLoginSuccess = (user: CometChat.User) => {
    setLoggedInUser(user);
  };

  const handleCredentialsSaved = () => {
    // Reload the page to re-initialize CometChat with new credentials
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

  if (showCredentials) {
    return (
      <CometChatThemeProvider theme={theme}>
        <CometChatCredentials onCredentialsSaved={handleCredentialsSaved} />
      </CometChatThemeProvider>
    );
  }

  if (!loggedInUser) {
    return (
      <CometChatThemeProvider theme={theme}>
        <CometChatLogin onLoginSuccess={handleLoginSuccess} onChangeCredentials={handleChangeCredentials} />
      </CometChatThemeProvider>
    );
  }

  return (
    <CometChatThemeProvider theme={theme}>
      <CometChatEventsProvider>
        <CometChatPluginRegistryContext.Provider value={pluginRegistry}>
          <LocaleProvider locale={locale} i18nInstance={i18nInstance}>
            <AppContextProvider>
              <CometChatHome loggedInUser={loggedInUser} onLogout={handleLogout} />
            </AppContextProvider>
          </LocaleProvider>
        </CometChatPluginRegistryContext.Provider>
      </CometChatEventsProvider>
    </CometChatThemeProvider>
  );
}

export default App;
