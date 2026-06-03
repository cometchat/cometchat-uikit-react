import React, { useCallback } from 'react';
import type { CometChatChangeScopeOptionProps } from './CometChatChangeScope.types';
import { useCometChatChangeScopeContext } from './CometChatChangeScope.context';
import { CometChatRadioButton } from '../CometChatRadioButton';
import './CometChatChangeScope.css';

/**
 * A single radio option within the scope list.
 * Uses CometChatRadioButton for consistent styling and accessibility.
 */
export const CometChatChangeScopeOption: React.FC<CometChatChangeScopeOptionProps> = ({
  option,
  className,
}) => {
  const { selectedId, selectOption } = useCometChatChangeScopeContext();
  const isSelected = selectedId === option.id;

  const handleChange = useCallback(() => {
    selectOption(option.id);
  }, [selectOption, option.id]);

  const baseClass = 'cometchat-change-scope__list-item';
  const itemClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <div className={itemClass} onClick={handleChange} role="none">
      <span className={'cometchat-change-scope__list-item-label'}>{option.label}</span>
      <CometChatRadioButton
        name="cometchat-change-scope"
        value={option.id}
        label=""
        checked={isSelected}
        onChange={handleChange}
        ariaLabel={option.label}
      />
    </div>
  );
};
