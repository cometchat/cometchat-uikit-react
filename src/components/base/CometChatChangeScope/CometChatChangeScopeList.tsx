import React from 'react';
import type { CometChatChangeScopeListProps } from './CometChatChangeScope.types';
import { CometChatChangeScopeOption } from './CometChatChangeScopeOption';
import { useCometChatChangeScopeContext } from './CometChatChangeScope.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatChangeScope.css';

/**
 * Radio group container for scope options.
 *
 * When no children are provided, reads `options` from context and renders
 * a `CometChatChangeScopeOption` for each. Pass children to override.
 */
export const CometChatChangeScopeList: React.FC<CometChatChangeScopeListProps> = ({
  className,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const { options } = useCometChatChangeScopeContext();

  const baseClass = 'cometchat-change-scope__list';
  const listClass = className ? `${baseClass} ${className}` : baseClass;

  const hasChildren = React.Children.count(children) > 0;

  return (
    <div
      className={listClass}
      role="radiogroup"
      aria-label={getLocalizedString('change_scope_title')}
    >
      {hasChildren
        ? children
        : options.map(opt => <CometChatChangeScopeOption key={opt.id} option={opt} />)}
    </div>
  );
};
