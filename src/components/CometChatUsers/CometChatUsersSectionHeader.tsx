import React from 'react';
import type { CometChatUsersSectionHeaderProps } from './CometChatUsers.types';
import './CometChatUsers.css';

/**
 * CometChatUsersSectionHeader — Alphabetical section divider.
 *
 * Uses role="presentation" to avoid axe violations inside role="listbox".
 * The visual separator is decorative; screen readers get context from the
 * alphabetical ordering of items.
 */
export const CometChatUsersSectionHeader: React.FC<CometChatUsersSectionHeaderProps> = ({
  letter,
}) => {
  return (
    <div className={'cometchat-users__section-header'} role="presentation" aria-hidden="true">
      <span className={'cometchat-users__section-header-text'}>{letter}</span>
    </div>
  );
};

CometChatUsersSectionHeader.displayName = 'CometChatUsers.SectionHeader';
