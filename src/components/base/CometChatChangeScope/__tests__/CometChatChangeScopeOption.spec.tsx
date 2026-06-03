import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { CometChatChangeScope } from '../CometChatChangeScope';
import type { CometChatChangeScopeOptionData } from '../CometChatChangeScope.types';

const options: CometChatChangeScopeOptionData[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'moderator', label: 'Moderator' },
  { id: 'participant', label: 'Participant' },
];

function renderWithOptions(defaultSelection = 'participant') {
  return render(
    <CometChatChangeScope.Root
      options={options}
      defaultSelection={defaultSelection}
      onScopeChanged={() => Promise.resolve()}
      onClose={() => {}}
    >
      <CometChatChangeScope.ScopeList>
        {options.map(opt => (
          <CometChatChangeScope.ScopeOption key={opt.id} option={opt} />
        ))}
      </CometChatChangeScope.ScopeList>
    </CometChatChangeScope.Root>
  );
}

describe('CometChatChangeScopeOption', () => {
  it('renders option label', () => {
    renderWithOptions();
    expect(screen.getByText('Admin')).toBeTruthy();
    expect(screen.getByText('Moderator')).toBeTruthy();
    expect(screen.getByText('Participant')).toBeTruthy();
  });

  it('shows as selected when matching current selection', () => {
    renderWithOptions('admin');
    const radios = screen.getAllByRole('radio');
    const adminRadio = radios.find(
      r => (r as HTMLInputElement).value === 'admin'
    ) as HTMLInputElement;
    expect(adminRadio.checked).toBe(true);
  });

  it('shows as unselected when not matching current selection', () => {
    renderWithOptions('participant');
    const radios = screen.getAllByRole('radio');
    const adminRadio = radios.find(
      r => (r as HTMLInputElement).value === 'admin'
    ) as HTMLInputElement;
    expect(adminRadio.checked).toBe(false);
  });

  it('calls selectOption on click (changes selection)', async () => {
    const user = userEvent.setup();
    renderWithOptions('participant');

    // Click on the Admin option's container
    await user.click(screen.getByText('Admin'));

    const radios = screen.getAllByRole('radio');
    const adminRadio = radios.find(
      r => (r as HTMLInputElement).value === 'admin'
    ) as HTMLInputElement;
    expect(adminRadio.checked).toBe(true);
  });

  it('renders as a radio input', () => {
    renderWithOptions();
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(3);
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatChangeScope.Root
        options={options}
        defaultSelection="participant"
        onScopeChanged={() => Promise.resolve()}
        onClose={() => {}}
      >
        <CometChatChangeScope.ScopeList>
          <CometChatChangeScope.ScopeOption option={options[0]!} className="custom-option" />
        </CometChatChangeScope.ScopeList>
      </CometChatChangeScope.Root>
    );
    const item = container.querySelector('.custom-option');
    expect(item).toBeTruthy();
  });
});
