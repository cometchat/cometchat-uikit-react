import React from 'react';
import type { CometChatChangeScopeErrorMessageProps } from './CometChatChangeScope.types';
import { useCometChatChangeScopeContext } from './CometChatChangeScope.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatChangeScope.css';

/**
 * Displays an error message when scope change fails.
 * Only renders when there is an error in context.
 */
export const CometChatChangeScopeErrorMessage: React.FC<CometChatChangeScopeErrorMessageProps> = ({
  className,
}) => {
  const { error } = useCometChatChangeScopeContext();
  const { getLocalizedString } = useLocale();

  if (!error) return null;

  const baseClass = 'cometchat-change-scope__error-view';
  const errorClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <div className={errorClass} role="alert">
      {getLocalizedString(error)}
    </div>
  );
};
