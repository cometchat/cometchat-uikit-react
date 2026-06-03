import React from 'react';
import type { CometChatFullScreenViewerNavigationProps } from './CometChatFullScreenViewer.types';
import { useCometChatFullScreenViewerContext } from './CometChatFullScreenViewer.context';
import './CometChatFullScreenViewer.css';
import { useLocale } from '../../../context/locale/LocaleContext';

/**
 * Gallery navigation buttons (prev/next). Only renders in gallery mode.
 */
export const CometChatFullScreenViewerNavigation: React.FC<
  CometChatFullScreenViewerNavigationProps
> = ({ className }) => {
  const { getLocalizedString } = useLocale();
  const { isGalleryMode, canNavigatePrev, canNavigateNext, navigatePrev, navigateNext } =
    useCometChatFullScreenViewerContext();

  if (!isGalleryMode) return null;

  const prevClasses = [
    'cometchat-fullscreen-viewer__nav-button',
    'cometchat-fullscreen-viewer__nav-button--prev',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const nextClasses = [
    'cometchat-fullscreen-viewer__nav-button',
    'cometchat-fullscreen-viewer__nav-button--next',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <button
        type="button"
        className={prevClasses}
        disabled={!canNavigatePrev}
        aria-disabled={!canNavigatePrev}
        aria-label={getLocalizedString('full_screen_viewer_previous')}
        onClick={navigatePrev}
      >
        <div className={'cometchat-fullscreen-viewer__nav-icon-prev'} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={nextClasses}
        disabled={!canNavigateNext}
        aria-disabled={!canNavigateNext}
        aria-label={getLocalizedString('full_screen_viewer_next')}
        onClick={navigateNext}
      >
        <div className={'cometchat-fullscreen-viewer__nav-icon-next'} aria-hidden="true" />
      </button>
    </>
  );
};

CometChatFullScreenViewerNavigation.displayName = 'CometChatFullScreenViewerNavigation';
