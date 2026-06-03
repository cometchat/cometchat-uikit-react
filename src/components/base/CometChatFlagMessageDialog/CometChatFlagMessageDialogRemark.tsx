import React, { useCallback } from 'react';
import type { CometChatFlagMessageDialogRemarkProps } from './CometChatFlagMessageDialog.types';
import { useCometChatFlagMessageDialogContext } from './CometChatFlagMessageDialog.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatFlagMessageDialog.css';

const REMARK_INPUT_ID = 'cometchat-flag-message-remark';

/**
 * Optional remark textarea for the flag message dialog.
 * Enforces a character limit with client-side validation and a character counter.
 */
export const CometChatFlagMessageDialogRemark: React.FC<CometChatFlagMessageDialogRemarkProps> = ({
  placeholder,
  maxLength = 500,
  label,
  className,
}) => {
  const { remark, setRemark, setErrorMessage } = useCometChatFlagMessageDialogContext();
  const { getLocalizedString } = useLocale();

  const resolvedLabel = label ?? getLocalizedString('flag_message_remark_label');
  const resolvedPlaceholder = placeholder ?? getLocalizedString('flag_message_remark_placeholder');

  const isAtLimit = remark.length >= maxLength;
  const remaining = maxLength - remark.length;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length > maxLength) {
        setErrorMessage(getLocalizedString('flag_message_character_limit_reached'));
      } else {
        setErrorMessage('');
      }
      setRemark(value.substring(0, maxLength));
    },
    [maxLength, setRemark, setErrorMessage, getLocalizedString]
  );

  const remarkClasses = ['cometchat-flag-message-dialog__remark', className]
    .filter(Boolean)
    .join(' ');

  const counterClasses = [
    'cometchat-flag-message-dialog__remark-counter',
    isAtLimit ? 'cometchat-flag-message-dialog__remark-counter--limit' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={remarkClasses}>
      <label htmlFor={REMARK_INPUT_ID} className={'cometchat-flag-message-dialog__remark-label'}>
        {resolvedLabel} <span>({getLocalizedString('flag_message_remark_optional')})</span>
      </label>
      <textarea
        id={REMARK_INPUT_ID}
        name={REMARK_INPUT_ID}
        placeholder={resolvedPlaceholder}
        className={'cometchat-flag-message-dialog__remark-input'}
        value={remark}
        onChange={handleChange}
        maxLength={maxLength}
        rows={3}
        aria-describedby="remark-character-count"
      />
      <div id="remark-character-count" className={counterClasses}>
        {isAtLimit
          ? getLocalizedString('flag_message_character_limit_reached')
          : `${String(remaining)} / ${String(maxLength)}`}
      </div>
    </div>
  );
};

CometChatFlagMessageDialogRemark.displayName = 'CometChatFlagMessageDialogRemark';
