import './styles/App.css';
import { useState, useEffect, useCallback, useRef } from 'react';
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
import { SDK_ENV, isOfflineRequested, offlineConfigOverrides } from './sdkEnv';
import { resolveLogout } from './utils/logoutOutcome';

/** `setOfflineConfig` exists only on kits with offline support (7.3.0+). */
type OfflineCapableBuilder = UIKitSettingsBuilder & {
  setOfflineConfig?: (config: { enabled: boolean } & Record<string, unknown>) => unknown;
};

function getCredentials() {
  const appId =
    COMETCHAT_CONSTANTS.APP_ID || SDK_ENV.appId || (localStorage.getItem('appId') ?? '');
  const region =
    COMETCHAT_CONSTANTS.REGION || SDK_ENV.region || (localStorage.getItem('region') ?? '');
  const authKey =
    COMETCHAT_CONSTANTS.AUTH_KEY || SDK_ENV.authKey || (localStorage.getItem('authKey') ?? '');
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

    const builder: OfflineCapableBuilder = new UIKitSettingsBuilder()
      .setAppId(appId)
      .setRegion(region)
      .setAuthKey(authKey)
      .subscribePresenceForAllUsers()
      .setCallingEnabled(SDK_ENV.calling);
    // Optional host overrides (the offline E2E mode points them at a local fake server).
    if (SDK_ENV.clientHost) builder.setClientHost(SDK_ENV.clientHost);
    if (SDK_ENV.adminHost) builder.setAdminHost(SDK_ENV.adminHost);
    if (isOfflineRequested()) {
      builder.setOfflineConfig?.({ ...offlineConfigOverrides(), enabled: true });
    }
    const settings = builder.build();

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
      // Tell screen readers which language the UI is in, so they pronounce it correctly.
      document.documentElement.lang = sharedInstance.getCurrentLanguage();
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

  // Offline, logout() ends the session on the device and then rejects; go to sign-in unless
  // the SDK still has the user. A second tap while one logout runs is ignored.
  const logoutRunning = useRef(false);
  const handleLogout = async () => {
    if (logoutRunning.current) return;
    logoutRunning.current = true;
    const { signedOut, error } = await resolveLogout(
      () => CometChatUIKit.logout(),
      () => CometChat.getLoggedinUser()
    );
    logoutRunning.current = false;
    if (signedOut) setLoggedInUser(null);
    else console.error('CometChat logout failed:', error);
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
