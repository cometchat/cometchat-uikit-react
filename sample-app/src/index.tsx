import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { metaInfo } from './metaInfo';

const getBrowserTheme = (): 'light' | 'dark' => {
  const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return isDarkTheme ? 'dark' : 'light';
};

try {
  CometChat.setDemoMetaInfo(metaInfo);
} catch {
  // ignore
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App theme={getBrowserTheme()} />);
