import React from 'react';
import type { CometChatThreadHeaderTitleProps } from './CometChatThreadHeader.types';
import { useLocale } from '../../hooks/useLocale';
import './CometChatThreadHeader.css';

/**
 * CometChatThreadHeaderTitle — displays the thread title.
 *
 * Defaults to the localized "Thread" text. Can be overridden via the `title` prop.
 */
export const CometChatThreadHeaderTitle: React.FC<CometChatThreadHeaderTitleProps> = ({
  title,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const displayTitle = title ?? getLocalizedString('thread_title');

  const titleClasses = ['cometchat-thread-header__title', className].filter(Boolean).join(' ');

  return <span className={titleClasses}>{displayTitle}</span>;
};

CometChatThreadHeaderTitle.displayName = 'CometChatThreadHeaderTitle';
