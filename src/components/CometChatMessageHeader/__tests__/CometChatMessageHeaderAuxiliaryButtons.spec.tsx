import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatMessageHeaderAuxiliaryButtons } from '../CometChatMessageHeaderAuxiliaryButtons';

describe('CometChatMessageHeaderAuxiliaryButtons', () => {
  it('renders children when provided', () => {
    render(
      <CometChatMessageHeaderAuxiliaryButtons>
        <button type="button">Custom Action</button>
      </CometChatMessageHeaderAuxiliaryButtons>
    );
    expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
  });

  it('renders nothing when children is undefined', () => {
    const { container } = render(<CometChatMessageHeaderAuxiliaryButtons />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when children is null', () => {
    const { container } = render(
      <CometChatMessageHeaderAuxiliaryButtons>{null}</CometChatMessageHeaderAuxiliaryButtons>
    );
    expect(container.innerHTML).toBe('');
  });

  it('applies the auxiliary-buttons CSS class', () => {
    const { container } = render(
      <CometChatMessageHeaderAuxiliaryButtons>
        <span>Content</span>
      </CometChatMessageHeaderAuxiliaryButtons>
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toBeInTheDocument();
    expect(root.tagName).toBe('DIV');
  });

  it('applies custom className alongside default class', () => {
    const { container } = render(
      <CometChatMessageHeaderAuxiliaryButtons className="my-custom-class">
        <span>Content</span>
      </CometChatMessageHeaderAuxiliaryButtons>
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('my-custom-class');
  });

  it('renders multiple children', () => {
    render(
      <CometChatMessageHeaderAuxiliaryButtons>
        <button type="button">Action 1</button>
        <button type="button">Action 2</button>
        <button type="button">Action 3</button>
      </CometChatMessageHeaderAuxiliaryButtons>
    );
    expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action 3' })).toBeInTheDocument();
  });

  it('has correct displayName', () => {
    expect(CometChatMessageHeaderAuxiliaryButtons.displayName).toBe(
      'CometChatMessageHeaderAuxiliaryButtons'
    );
  });
});
