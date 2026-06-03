import React from 'react';
import type { CometChatConfirmDialogIconProps } from './CometChatConfirmDialog.types';
import { useCometChatConfirmDialogContext } from './CometChatConfirmDialog.context';
import './CometChatConfirmDialog.css';
import deleteIcon from '../../../assets/delete.svg';

/**
 * Icon area for the confirm dialog. Renders a variant-based default icon
 * or a custom icon when the `icon` prop is provided.
 */
export const CometChatConfirmDialogIcon: React.FC<CometChatConfirmDialogIconProps> = ({
  icon,
  className,
}) => {
  const { variant } = useCometChatConfirmDialogContext();

  const wrapperClasses = [
    'cometchat-confirm-dialog__icon',
    `cometchat-confirm-dialog__icon--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      {icon ?? (
        <img
          className={'cometchat-confirm-dialog__icon-default'}
          src={deleteIcon}
          alt=""
          aria-hidden="true"
          decoding="async"
          width={36}
          height={36}
          draggable={false}
        />
      )}
    </div>
  );
};

CometChatConfirmDialogIcon.displayName = 'CometChatConfirmDialogIcon';
