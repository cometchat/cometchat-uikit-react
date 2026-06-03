import { useState } from 'react';
import cometChatLogo from '../../assets/cometchat_logo.svg';
import cometChatLogoDark from '../../assets/cometchat_logo_dark.svg';
import usIcon from '../../assets/us-icon.svg';
import euIcon from '../../assets/eu-icon.svg';
import inIcon from '../../assets/in-icon.svg';
import '../../styles/CometChatCredentials/CometChatCredentials.css';

interface CometChatCredentialsProps {
  onCredentialsSaved: () => void;
}

const CometChatCredentials = ({ onCredentialsSaved }: CometChatCredentialsProps) => {
  const isDarkMode = document.querySelector('[data-theme="dark"]') ? true : false;

  const [region, setRegion] = useState(localStorage.getItem('region') || 'us');
  const [appId, setAppId] = useState(localStorage.getItem('appId') ?? '');
  const [authKey, setAuthKey] = useState(localStorage.getItem('authKey') ?? '');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!appId.trim() || !authKey.trim()) {
      return;
    }

    localStorage.setItem('region', region);
    localStorage.setItem('appId', appId.trim());
    localStorage.setItem('authKey', authKey.trim());

    onCredentialsSaved();
  }

  return (
    <div className="cometchat-credentials__page">
      <div className="cometchat-credentials__logo">
        {isDarkMode ? (
          <img src={cometChatLogoDark} alt="CometChat" />
        ) : (
          <img src={cometChatLogo} alt="CometChat" />
        )}
      </div>
      <div className="cometchat-credentials__container">
        <div className="cometchat-credentials__header">
          <div className="cometchat-credentials__title">App Credentials</div>
        </div>
        <form onSubmit={handleSubmit} className="cometchat-credentials__form">
          <div className="cometchat-credentials__form-group">
            <div className="cometchat-credentials__form-label">Region</div>
            <div className="cometchat-credentials__region-wrapper">
              <div
                onClick={() => setRegion('us')}
                className={`cometchat-credentials__region ${
                  region === 'us' ? 'cometchat-credentials__region-selected' : ''
                }`}
              >
                <img src={usIcon} alt="" />
                <div className="cometchat-credentials__region-text">US</div>
              </div>
              <div
                onClick={() => setRegion('eu')}
                className={`cometchat-credentials__region ${
                  region === 'eu' ? 'cometchat-credentials__region-selected' : ''
                }`}
              >
                <img src={euIcon} alt="" />
                <div className="cometchat-credentials__region-text">EU</div>
              </div>
              <div
                onClick={() => setRegion('in')}
                className={`cometchat-credentials__region ${
                  region === 'in' ? 'cometchat-credentials__region-selected' : ''
                }`}
              >
                <img src={inIcon} alt="" />
                <div className="cometchat-credentials__region-text">IN</div>
              </div>
            </div>
          </div>

          <div className="cometchat-credentials__form-group">
            <label className="cometchat-credentials__form-label" htmlFor="appId-input">
              APP ID
            </label>
            <input
              id="appId-input"
              className="cometchat-credentials__form-input"
              type="text"
              placeholder="Enter the app ID"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              required
            />
          </div>

          <div className="cometchat-credentials__form-group">
            <label className="cometchat-credentials__form-label" htmlFor="authKey-input">
              Auth Keys
            </label>
            <input
              id="authKey-input"
              className="cometchat-credentials__form-input"
              type="text"
              placeholder="Enter the auth key"
              value={authKey}
              onChange={(e) => setAuthKey(e.target.value)}
              required
            />
          </div>

          <button className="cometchat-credentials__button" type="submit">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default CometChatCredentials;
