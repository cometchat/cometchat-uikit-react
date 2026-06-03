import React, { useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '@cometchat/chat-uikit-react';
import { sampleUsers } from './sampledata';
import cometChatLogo from '../../assets/cometchat_logo.svg';
import cometChatLogoDark from '../../assets/cometchat_logo_dark.svg';
import '../../styles/CometChatLogin/CometChatLogin.css';

type User = {
  name: string;
  uid: string;
  avatar: string;
};

type UserJson = {
  users: User[];
};

interface CometChatLoginProps {
  onLoginSuccess: (user: CometChat.User) => void;
  onChangeCredentials?: () => void;
}

const CometChatLogin = ({ onLoginSuccess, onChangeCredentials }: CometChatLoginProps) => {
  const [defaultUsers, setDefaultUsers] = useState<User[]>([]);
  const [uid, setUid] = useState('');
  const [selectedUid, setSelectedUid] = useState('');
  const [error, setError] = useState('');
  const isDarkMode = document.querySelector('[data-theme="dark"]') ? true : false;

  useEffect(() => {
    fetchDefaultUsers();
    return () => {
      setDefaultUsers([]);
    };
  }, []);

  async function fetchDefaultUsers() {
    try {
      const response = await fetch(
        'https://assets.cc-cluster-2.io/sampleapp/v2/sampledata.json'
      );
      const data: UserJson = await response.json();
      setDefaultUsers(data.users);
    } catch (err) {
      setDefaultUsers(sampleUsers.users);
      console.log('fetching default users failed, using fallback data', err);
    }
  }

  async function login(loginUid: string) {
    setSelectedUid(loginUid);
    setError('');
    try {
      const user = await CometChatUIKit.login(loginUid);
      console.log('Login successful, loggedInUser:', user);
      onLoginSuccess(user);
    } catch (err) {
      console.log('login failed', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      setSelectedUid('');
    }
  }

  async function handleLoginWithUidFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uid.trim()) {
      await login(uid.trim());
    }
  }

  function getUserBtnWithKeyAdded({ name, uid: userUid, avatar }: User) {
    return (
      <div
        key={userUid}
        onClick={() => login(userUid)}
        className={`cometchat-login__user ${selectedUid === userUid ? 'cometchat-login__user-selected' : ''}`}
      >
        {selectedUid === userUid ? (
          <div className="cometchat-login__user-selection-indicator">
            <div className="cometchat-login__user-selection-checked" />
          </div>
        ) : null}

        <img
          src={avatar}
          alt={`${name}'s avatar`}
          className="cometchat-login__user-avatar"
        />
        <div className="cometchat-login__user-name-and-uid cometchat-login__user-details">
          <div className="cometchat-login__user-name">{name}</div>
          <div className="cometchat-login__user-uid">{userUid}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cometchat-login__container">
      <div className="cometchat-login__logo">
        {isDarkMode ? <img src={cometChatLogoDark} alt="CometChat" /> : <img src={cometChatLogo} alt="CometChat" />}
      </div>
      <div className="cometchat-login__content">
        <div className="cometchat-login__header">
          <div className="cometchat-login__title">Sign in to CometChat</div>
          <div className="cometchat-login__sample-users">
            <div className="cometchat-login__sample-users-title">
              Using our sample users
            </div>
            <div className="cometchat-login__user-list">
              {defaultUsers.map(getUserBtnWithKeyAdded)}
            </div>
          </div>
        </div>

        <div className="cometchat-login__divider-section">
          <div className="cometchat-login__divider" />
          <span className="cometchat-login__divider-text">Or</span>
          <div className="cometchat-login__divider" />
        </div>

        <div className="cometchat-login__custom-login">
          <form onSubmit={handleLoginWithUidFormSubmit} className="cometchat-login__form">
            <div className="cometchat-login__input-group">
              <label className="cometchat-login__input-label" htmlFor="uid-input">
                Your UID
              </label>
              <input
                id="uid-input"
                className="cometchat-login__input"
                type="text"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                required
                placeholder="Enter your UID"
              />
            </div>

            <button className="cometchat-login__submit-button" type="submit">
              Login
            </button>
            {error && <div className="cometchat-login__error">{error}</div>}
            {onChangeCredentials && (
              <div className="cometchat-login__note">
                Change <span className="cometchat-login__note-link" onClick={onChangeCredentials}>App Credentials</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CometChatLogin;
