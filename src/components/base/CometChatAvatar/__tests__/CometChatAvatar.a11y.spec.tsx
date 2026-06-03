import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatAvatarContext } from '../CometChatAvatar.context';
import { CometChatAvatarImage } from '../CometChatAvatarImage';
import { CometChatAvatarInitials } from '../CometChatAvatarInitials';
import { CometChatAvatarStatusIndicator } from '../CometChatAvatarStatusIndicator';
import type { CometChatAvatarContextValue } from '../CometChatAvatar.types';

expect.extend(toHaveNoViolations);

function createCtx(
  overrides: Partial<CometChatAvatarContextValue> = {}
): CometChatAvatarContextValue {
  return {
    name: 'John Doe',
    image: 'https://example.com/avatar.png',
    size: 'medium',
    imageLoaded: true,
    imageError: false,
    ...overrides,
  };
}

function renderAvatar(
  ctx: Partial<CometChatAvatarContextValue> = {},
  includeStatus?: 'online' | 'offline'
) {
  const context = createCtx(ctx);
  return render(
    <CometChatAvatarContext.Provider value={context}>
      <div role="img" aria-label={context.name}>
        <CometChatAvatarImage />
        <CometChatAvatarInitials />
        {includeStatus ? <CometChatAvatarStatusIndicator status={includeStatus} /> : null}
      </div>
    </CometChatAvatarContext.Provider>
  );
}

describe('CometChatAvatar a11y', () => {
  it('passes axe-core audit (image variant)', async () => {
    const { container } = renderAvatar();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit (initials variant)', async () => {
    const { container } = renderAvatar({ image: '', imageLoaded: false });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with status indicator', async () => {
    const { container } = renderAvatar({}, 'online');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('image has proper alt text', () => {
    renderAvatar({ name: 'Jane Smith' });
    const images = screen.getAllByRole('img', { name: 'Jane Smith' });
    const imgEl = images.find(el => el.tagName === 'IMG');
    expect(imgEl).toBeDefined();
    expect(imgEl).toHaveAttribute('alt', 'Jane Smith');
  });

  it('initials have proper aria-label', () => {
    renderAvatar({ image: '', imageLoaded: false, name: 'John Doe' });
    expect(screen.getByText('JD')).toHaveAttribute('aria-label', 'John Doe');
  });
});
