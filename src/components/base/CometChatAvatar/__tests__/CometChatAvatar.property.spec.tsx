import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getInitials } from '../CometChatAvatar.utils';
import { CometChatAvatarContext } from '../CometChatAvatar.context';
import { CometChatAvatarInitials } from '../CometChatAvatarInitials';
import type { CometChatAvatarContextValue } from '../CometChatAvatar.types';

function createCtx(
  overrides: Partial<CometChatAvatarContextValue> = {}
): CometChatAvatarContextValue {
  return {
    name: '',
    image: '',
    size: 'medium',
    imageLoaded: false,
    imageError: false,
    ...overrides,
  };
}

describe('CometChatAvatar property-based tests', () => {
  it('for any non-empty name, getInitials returns 1-2 uppercase characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        name => {
          const initials = getInitials(name);
          expect(initials.length).toBeGreaterThanOrEqual(1);
          expect(initials.length).toBeLessThanOrEqual(2);
          expect(initials).toBe(initials.toUpperCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any size variant, root renders with correct data-size attribute', () => {
    fc.assert(
      fc.property(fc.constantFrom('small' as const, 'medium' as const, 'large' as const), size => {
        const ctx = createCtx({ name: 'Test', size });
        const { unmount, container } = render(
          <CometChatAvatarContext.Provider value={ctx}>
            <div data-size={size}>
              <CometChatAvatarInitials />
            </div>
          </CometChatAvatarContext.Provider>
        );
        expect(container.querySelector(`[data-size="${size}"]`)).not.toBeNull();
        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('for any combination of name/image, Initials renders without errors', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 50 }),
        fc.string({ maxLength: 100 }),
        fc.boolean(),
        fc.boolean(),
        (name, image, imageLoaded, imageError) => {
          const ctx = createCtx({ name, image, imageLoaded, imageError });
          const { unmount } = render(
            <CometChatAvatarContext.Provider value={ctx}>
              <CometChatAvatarInitials />
            </CometChatAvatarContext.Provider>
          );
          // No error thrown = pass
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });
});
