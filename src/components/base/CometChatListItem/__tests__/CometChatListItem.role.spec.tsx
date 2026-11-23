import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CometChatListItem } from '../CometChatListItem';

describe('CometChatListItem role', () => {
  it('is an option with aria-selected by default', () => {
    const { container } = render(<CometChatListItem id="a" title="A" />);
    const row = container.querySelector('.cometchat-list-item');
    expect(row).toHaveAttribute('role', 'option');
    expect(row).toHaveAttribute('aria-selected', 'false');
  });

  it('as a group it has no aria-selected, which only an option allows', () => {
    const { container } = render(<CometChatListItem id="a" title="A" role="group" />);
    const row = container.querySelector('.cometchat-list-item');
    expect(row).toHaveAttribute('role', 'group');
    expect(row).not.toHaveAttribute('aria-selected');
  });
});
