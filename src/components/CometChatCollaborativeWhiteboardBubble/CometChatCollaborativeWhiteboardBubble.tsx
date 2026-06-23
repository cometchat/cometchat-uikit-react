import React, { useCallback, useState } from 'react';
import type { CometChatCollaborativeWhiteboardBubbleProps } from './CometChatCollaborativeWhiteboardBubble.types';
import { extractExtensionUrl } from '../../plugins/shared/extractExtensionUrl';
import { getBubbleAlignment } from '../../utils/getBubbleAlignment';
import { useLocale } from '../../hooks/useLocale';
import { useTheme } from '../../context/ThemeContext';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';
import bannerLight from '../../assets/Collaborative_Whiteboard_Light.png';
import bannerDark from '../../assets/Collaborative_Whiteboard_Dark.png';
// Shared collaborative-bubble styles (co-located in the document bubble dir).
import '../CometChatCollaborativeDocumentBubble/CometChatCollaborativeBubble.css';

const EXTENSION_KEY = 'whiteboard';
const URL_KEY = 'board_url';

/**
 * CometChatCollaborativeWhiteboardBubble — renders a collaborative whiteboard message.
 *
 * Takes the SDK message and extracts the board URL from its metadata itself;
 * localization and theme come from hooks, so it can be used directly (no plugin).
 *
 * Structure: Banner image → Body (icon + title/subtitle) → Action button.
 */
export const CometChatCollaborativeWhiteboardBubble: React.FC<
  CometChatCollaborativeWhiteboardBubbleProps
> = ({ message, alignment, onButtonClick, disabled = false, className }) => {
  const { getLocalizedString } = useLocale();
  const { theme } = useTheme();
  const loggedInUser = useLoggedInUser();
  const IframeContext = useCometChatFrameContext();
  const [bannerError, setBannerError] = useState(false);

  const getCurrentWindow = useCallback(() => {
    return IframeContext.iframeWindow ?? window;
  }, [IframeContext.iframeWindow]);

  const url = extractExtensionUrl(message, EXTENSION_KEY, URL_KEY);
  const variant =
    (alignment ?? getBubbleAlignment(message, loggedInUser)) === 'right' ? 'outgoing' : 'incoming';
  const bannerImageUrl = theme === 'dark' ? bannerDark : bannerLight;
  const title = getLocalizedString('message_list_collaborative_whiteboard_title');
  const subtitle = getLocalizedString('message_collaborative_whiteboard_subtitile');
  const buttonText = getLocalizedString('message_list_collaborative_whiteboard_open');

  const isButtonDisabled = disabled || url.trim().length === 0;

  const handleButtonClick = useCallback(() => {
    if (isButtonDisabled || !url) return;
    if (onButtonClick) {
      onButtonClick(url);
    } else {
      getCurrentWindow().open(url, '', 'fullscreen=yes, scrollbars=auto');
    }
  }, [url, isButtonDisabled, onButtonClick, getCurrentWindow]);

  const handleBannerError = useCallback(() => {
    setBannerError(true);
  }, []);

  const rootClasses = [
    'cometchat-collaborative-bubble',
    `cometchat-collaborative-bubble--${variant}`,
    'cometchat-collaborative-bubble--whiteboard',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      {bannerImageUrl && !bannerError && (
        <div className={'cometchat-collaborative-bubble__banner-image'}>
          <img src={bannerImageUrl} alt="" onError={handleBannerError} />
        </div>
      )}

      <div className={'cometchat-collaborative-bubble__body'}>
        <div className={'cometchat-collaborative-bubble__body-icon'} aria-hidden="true" />
        <div className={'cometchat-collaborative-bubble__body-content'}>
          <div className={'cometchat-collaborative-bubble__body-content-name'}>
            <label title={title}>{title}</label>
          </div>
          {subtitle.trim().length > 0 && (
            <div className={'cometchat-collaborative-bubble__body-content-description'}>
              <label title={subtitle}>{subtitle}</label>
            </div>
          )}
        </div>
      </div>

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

CometChatCollaborativeWhiteboardBubble.displayName = 'CometChatCollaborativeWhiteboardBubble';
