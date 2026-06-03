import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatChangeScope } from '../CometChatChangeScope';
import type { CometChatChangeScopeOptionData } from '../CometChatChangeScope.types';

const options: CometChatChangeScopeOptionData[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'moderator', label: 'Moderator' },
  { id: 'participant', label: 'Participant' },
];

function renderChangeScope(
  props: Partial<React.ComponentProps<typeof CometChatChangeScope.Root>> = {}
) {
  const merged = { options, defaultSelection: 'participant', ...props };
  return render(
    <CometChatChangeScope.Root {...merged}>
      <CometChatChangeScope.Header />
      <CometChatChangeScope.ScopeList>
        {merged.options.map(opt => (
          <CometChatChangeScope.ScopeOption key={opt.id} option={opt} />
        ))}
      </CometChatChangeScope.ScopeList>
      <CometChatChangeScope.ErrorMessage />
      <CometChatChangeScope.Actions />
    </CometChatChangeScope.Root>
  );
}

describe('CometChatChangeScopeRoot', () => {
  it('renders the root container with role="dialog"', () => {
    renderChangeScope();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('has aria-modal="true"', () => {
    renderChangeScope();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to the title', () => {
    renderChangeScope();
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    // The title element should exist with that id.
    const title = document.getElementById(labelledBy!);
    expect(title).toBeTruthy();
  });

  it('provides context to children (options render)', () => {
    renderChangeScope();
    expect(screen.getByText('Admin')).toBeTruthy();
    expect(screen.getByText('Moderator')).toBeTruthy();
    expect(screen.getByText('Participant')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = renderChangeScope({ className: 'my-scope' });
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.className).toContain('my-scope');
  });

  it('sets default selection from props', () => {
    renderChangeScope({ defaultSelection: 'admin' });
    const radios = screen.getAllByRole('radio');
    const adminRadio = radios.find(
      r => (r as HTMLInputElement).value === 'admin'
    ) as HTMLInputElement;
    expect(adminRadio.checked).toBe(true);
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    renderChangeScope({ onClose });

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
