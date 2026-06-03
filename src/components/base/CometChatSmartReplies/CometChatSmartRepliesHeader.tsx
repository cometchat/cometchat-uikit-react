import React from 'react';
import type { CometChatSmartRepliesHeaderProps } from './CometChatSmartReplies.types';
import { useCometChatSmartRepliesContext } from './CometChatSmartReplies.context';
import './CometChatSmartReplies.css';
import { useLocale } from '../../../context/locale/LocaleContext';

const DEFAULT_TITLE = 'Suggest a reply';

/**
 * Header sub-component with title and close button.
 */
export const CometChatSmartRepliesHeader: React.FC<CometChatSmartRepliesHeaderProps> = ({
  title,
  showCloseButton = true,
  className,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const { onClose } = useCometChatSmartRepliesContext();

  const headerBase = 'cometchat-smart-replies__header';
  const headerClass = className ? `${headerBase} ${className}` : headerBase;

  if (children) {
    return <div className={headerClass}>{children}</div>;
  }

  return (
    <div className={headerClass}>
      <h2 className={'cometchat-smart-replies__header-title'}>{title ?? DEFAULT_TITLE}</h2>
      {showCloseButton && (
        <button
          type="button"
          className={'cometchat-smart-replies__header-close-button'}
          aria-label={getLocalizedString('ai_smart_replies_close')}
          onClick={() => onClose?.()}
        />
      )}
    </div>
  );
};
