/**
 * CometChatCollaborativeBubble
 *
 * Shared bubble component for collaborative document and whiteboard messages.
 *
 * Structure: Banner image → Body (icon + title/subtitle) → Action button with border-top separator.
 */

import React, { useCallback, useState } from 'react';
import type { CometChatCollaborativeBubbleProps } from './CometChatCollaborativeBubble.types';
import './CometChatCollaborativeBubble.css';

export const CometChatCollaborativeBubble: React.FC<CometChatCollaborativeBubbleProps> = ({
  url,
  variant,
  title,
  subtitle,
  buttonText,
  bannerImageUrl,
  iconType = 'document',
  onButtonClick,
  disabled = false,
  className,
}) => {
  const [bannerError, setBannerError] = useState(false);

  const isButtonDisabled = disabled || url.trim().length === 0;

  const handleButtonClick = useCallback(() => {
    if (isButtonDisabled || !url) return;
    if (onButtonClick) {
      onButtonClick(url);
    } else {
      window.open(url, '', 'fullscreen=yes, scrollbars=auto');
    }
  }, [url, isButtonDisabled, onButtonClick]);

  const handleBannerError = useCallback(() => {
    setBannerError(true);
  }, []);

  const rootClasses = [
    'cometchat-collaborative-bubble',
    `cometchat-collaborative-bubble--${variant}`,
    `cometchat-collaborative-bubble--${iconType}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      {/* Banner Image */}
      {bannerImageUrl && !bannerError && (
        <div className={'cometchat-collaborative-bubble__banner-image'}>
          <img src={bannerImageUrl} alt="" onError={handleBannerError} />
        </div>
      )}

      {/* Body: Icon + Content */}
      <div className={'cometchat-collaborative-bubble__body'}>
        <div className={'cometchat-collaborative-bubble__body-icon'} aria-hidden="true" />
        <div className={'cometchat-collaborative-bubble__body-content'}>
          <div className={'cometchat-collaborative-bubble__body-content-name'}>
            <label title={title}>{title}</label>
          </div>
          {subtitle && subtitle.trim().length > 0 && (
            <div className={'cometchat-collaborative-bubble__body-content-description'}>
              <label title={subtitle}>{subtitle}</label>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        className={'cometchat-collaborative-bubble__button'}
        title={buttonText}
        disabled={isButtonDisabled}
        aria-label={buttonText}
        onClick={handleButtonClick}
      >
        {buttonText}
      </button>
    </div>
  );
};

CometChatCollaborativeBubble.displayName = 'CometChatCollaborativeBubble';
