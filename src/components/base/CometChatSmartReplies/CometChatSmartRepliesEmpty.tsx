import React from 'react';
import type { CometChatSmartRepliesEmptyProps } from './CometChatSmartReplies.types';
import { useCometChatSmartRepliesContext } from './CometChatSmartReplies.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatSmartReplies.css';

/**
 * Empty state view for smart replies.
 * Only renders when context state is 'empty'.
 */
export const CometChatSmartRepliesEmpty: React.FC<CometChatSmartRepliesEmptyProps> = ({
  message,
  className,
  children,
}) => {
  const { state } = useCometChatSmartRepliesContext();
  const { getLocalizedString } = useLocale();

  if (state !== 'empty') return null;

  if (children) {
    return <>{children}</>;
  }

  const emptyBase = 'cometchat-smart-replies__empty-view';
  const emptyClass = className ? `${emptyBase} ${className}` : emptyBase;

  return (
    <div className={emptyClass}>
      <span>{message ?? getLocalizedString('smart_replies_empty')}</span>
    </div>
  );
};
