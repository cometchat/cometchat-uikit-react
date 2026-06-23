import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatChangeScope } from '../CometChatChangeScope';
import type { CometChatChangeScopeOptionData } from '../CometChatChangeScope.types';

const options: CometChatChangeScopeOptionData[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'moderator', label: 'Moderator' },
  { id: 'participant', label: 'Participant' },
];

function renderFull(defaultSelection = 'participant') {
  return render(
    <CometChatChangeScope.Root
      options={options}
      defaultSelection={defaultSelection}
      onScopeChanged={() => Promise.resolve()}
      onClose={() => {}}
    >
      <CometChatChangeScope.Header />
      <CometChatChangeScope.ScopeList>
        {options.map(opt => (
          <CometChatChangeScope.ScopeOption key={opt.id} option={opt} />
        ))}
      </CometChatChangeScope.ScopeList>
      <CometChatChangeScope.ErrorMessage />
      <CometChatChangeScope.Actions />
    </CometChatChangeScope.Root>
  );
}

describe('CometChatChangeScope accessibility', () => {
  it('root has role="dialog" with aria-modal', () => {
    renderFull();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('dialog has aria-labelledby pointing to the title element', () => {
    renderFull();
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const titleEl = document.getElementById(labelledBy!);
    expect(titleEl).toBeTruthy();
    expect(titleEl?.tagName.toLowerCase()).toBe('h2');
  });

  it('radio group has role="radiogroup" with aria-label', () => {
    renderFull();
    const radiogroup = screen.getByRole('radiogroup');
    expect(radiogroup).toHaveAttribute('aria-label');
  });

  it('each option renders a radio input', () => {
    renderFull();
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(3);
  });

  it('selected option has aria-checked="true"', () => {
    renderFull('admin');
    const radios = screen.getAllByRole('radio');
    const adminRadio = radios.find(r => (r as HTMLInputElement).value === 'admin');
    expect(adminRadio).toBeChecked();
  });

  it('unselected options have aria-checked="false"', () => {
    renderFull('admin');
    const radios = screen.getAllByRole('radio');
    const others = radios.filter(r => (r as HTMLInputElement).value !== 'admin');
    others.forEach(r => {
      expect(r).not.toBeChecked();
    });
  });

  it('submit button has aria-disabled when selection unchanged', () => {
    renderFull();
    const buttons = screen.getAllByRole('button');
    const disabledBtn = buttons.find(b => b.hasAttribute('aria-disabled'));
    expect(disabledBtn).toBeTruthy();
  });

  it('buttons are semantic <button> elements', () => {
    renderFull();
    const buttons = screen.getAllByRole('button');
    buttons.forEach(b => {
      expect(b.tagName.toLowerCase()).toBe('button');
    });
  });

  it('header icon is decorative (aria-hidden)', () => {
    const { container } = renderFull();
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('aria-hidden', 'true');
  });
});
