import React from 'react';
import type { CometChatChangeScopeHeaderProps } from './CometChatChangeScope.types';
import { TITLE_ID } from './CometChatChangeScopeRoot';
import { useLocale } from '../../../context/locale/LocaleContext';
import changeScopeIcon from '../../../assets/change_scope.png';
import './CometChatChangeScope.css';

/**
 * Header sub-component: icon, title, and description.
 */
export const CometChatChangeScopeHeader: React.FC<CometChatChangeScopeHeaderProps> = ({
  title,
  description,
  showIcon = true,
  className,
}) => {
  const { getLocalizedString } = useLocale();

  const resolvedTitle = title ?? getLocalizedString('change_scope_title');
  const resolvedDescription = description ?? getLocalizedString('change_scope_subtitle');

  const baseClass = 'cometchat-change-scope__header';
  const headerClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <div className={headerClass}>
      {showIcon && (
        <div className={'cometchat-change-scope__icon-container'}>
          <img
            className={'cometchat-change-scope__icon'}
            src={changeScopeIcon}
            alt=""
            aria-hidden="true"
            width={48}
            height={48}
          />
        </div>
      )}
      <h2 id={TITLE_ID} className={'cometchat-change-scope__title'}>
        {resolvedTitle}
      </h2>
      <p className={'cometchat-change-scope__description'}>{resolvedDescription}</p>
    </div>
  );
};
