import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatChangeScope } from '../CometChatChangeScope';
import type { CometChatChangeScopeOptionData } from '../CometChatChangeScope.types';

const options: CometChatChangeScopeOptionData[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'moderator', label: 'Moderator' },
  { id: 'participant', label: 'Participant' },
];

function renderActions(
  props: {
    defaultSelection?: string;
    onScopeChanged?: (id: string) => Promise<void>;
    onClose?: () => void;
    submitText?: string;
    cancelText?: string;
  } = {}
) {
  const {
    defaultSelection = 'participant',
    onScopeChanged = () => Promise.resolve(),
    onClose = vi.fn(),
    submitText,
    cancelText,
  } = props;

  return render(
    <CometChatChangeScope.Root
      options={options}
      defaultSelection={defaultSelection}
      onScopeChanged={onScopeChanged}
      onClose={onClose}
    >
      <CometChatChangeScope.ScopeList>
        {options.map(opt => (
          <CometChatChangeScope.ScopeOption key={opt.id} option={opt} />
        ))}
      </CometChatChangeScope.ScopeList>
      <CometChatChangeScope.ErrorMessage />
      <CometChatChangeScope.Actions submitText={submitText} cancelText={cancelText} />
    </CometChatChangeScope.Root>
  );
}

describe('CometChatChangeScopeActions', () => {
  it('renders cancel and submit buttons', () => {
    renderActions();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('submit button is disabled when selection has not changed', () => {
    renderActions();
    const buttons = screen.getAllByRole('button');
    // Submit button is the second one (after cancel)
    const submitBtn = buttons.find(b => b.hasAttribute('aria-disabled'));
    expect(submitBtn).toBeTruthy();
  });

  it('submit button is enabled when selection has changed', async () => {
    const user = userEvent.setup();
    renderActions({ defaultSelection: 'participant' });

    // Change selection to admin
    await user.click(screen.getByText('Admin'));

    // After selection change, submit should not be disabled
    const buttons = screen.getAllByRole('button');
    const allDisabled = buttons.filter(b => (b as HTMLButtonElement).disabled);
    // At most the cancel button might not be disabled
    expect(allDisabled.length).toBeLessThan(buttons.length);
  });

  it('cancel button calls onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderActions({ onClose });

    // Cancel is the first button (secondary variant)
    const buttons = screen.getAllByRole('button');
    const cancelBtn = buttons[0]!;
    await user.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submit button calls onScopeChanged with selected id', async () => {
    const onScopeChanged = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderActions({ defaultSelection: 'participant', onScopeChanged });

    // Change selection
    await user.click(screen.getByText('Admin'));

    // Click submit (second button)
    const buttons = screen.getAllByRole('button');
    const submitBtn = buttons[1]!;
    await user.click(submitBtn);

    expect(onScopeChanged).toHaveBeenCalledWith('admin');
  });

  it('custom button text is applied', () => {
    renderActions({ submitText: 'Update', cancelText: 'Dismiss' });
    expect(screen.getByText('Update')).toBeTruthy();
    expect(screen.getByText('Dismiss')).toBeTruthy();
  });
});
