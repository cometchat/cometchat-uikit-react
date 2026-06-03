import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatAvatarContext } from '../CometChatAvatar.context';
import { CometChatAvatarImage } from '../CometChatAvatarImage';
import type { CometChatAvatarContextValue } from '../CometChatAvatar.types';

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

function renderImage(ctx?: Partial<CometChatAvatarContextValue>, className?: string) {
  return render(
    <CometChatAvatarContext.Provider value={createCtx(ctx)}>
      <CometChatAvatarImage className={className} />
    </CometChatAvatarContext.Provider>
  );
}

describe('CometChatAvatarImage', () => {
  it('renders an img element when image URL is provided', () => {
    renderImage();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('sets alt attribute to the name from context', () => {
    renderImage({ name: 'Jane Smith' });
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Jane Smith');
  });

  it('renders nothing when imageError is true', () => {
    const { container } = renderImage({ imageError: true });
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when image is empty', () => {
    const { container } = renderImage({ image: '' });
    expect(container.innerHTML).toBe('');
  });

  it('applies custom className', () => {
    renderImage({}, 'img-extra');
    expect(screen.getByRole('img').className).toContain('img-extra');
  });
});
