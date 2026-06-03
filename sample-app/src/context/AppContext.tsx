import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { appReducer, defaultAppState, type AppState, type AppAction } from './appReducer';

interface AppContextValue {
  appState: AppState;
  setAppState: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue>({
  appState: defaultAppState,
  setAppState: () => {},
});

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [appState, setAppState] = useReducer(appReducer, defaultAppState);

  return (
    <AppContext.Provider value={{ appState, setAppState }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);

export { AppContext };
