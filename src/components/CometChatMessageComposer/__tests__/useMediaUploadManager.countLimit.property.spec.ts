/**
 * Property-based tests for the upload manager's per-batch count-limit trimming.
 *
 * Feature: multi-attachments, Property 1: Count-limit trimming never exceeds max
 * Validates: Requirements 1.5, 9.2, 9.3
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReducer } from 'react';
import * as fc from 'fast-check';
import { mockCometChat } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));

import { enforceCountLimit, useMediaUploadManager } from '../useMediaUploadManager';
import { composerReducer, initialComposerState } from '../CometChatMessageComposer.reducer';

/** Wires the real composer reducer to the upload manager (max comes from the SDK). */
function useHarness() {
  const [state, dispatch] = useReducer(composerReducer, initialComposerState);
  const manager = useMediaUploadManager({
    dispatch,
    tray: state.tray,
    receiverId: 'receiver-1',
    receiverType: 'user',
  });
  return { state, manager };
}

function makeFiles(count: number): File[] {
  return Array.from(
    { length: count },
    (_v, i) => new File(['x'], `f-${String(i)}.png`, { type: 'image/png' })
  );
}

describe('Feature: multi-attachments, Property 1: Count-limit trimming never exceeds max', () => {
  describe('enforceCountLimit (pure)', () => {
    it('never exceeds max; accepts the whole pick or nothing (all-or-nothing)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // max
          fc.integer({ min: 0, max: 50 }), // currentCount (staged, always <= max by invariant)
          fc.integer({ min: 0, max: 50 }), // pickedCount
          (max, currentRaw, pickedCount) => {
            // The tray invariant guarantees the staged count never exceeds max.
            const currentCount = Math.min(currentRaw, max);
            const picked = makeFiles(pickedCount);

            const { accepted, rejected } = enforceCountLimit(currentCount, picked, max);

            // All-or-nothing: the whole pick is accepted only if it fits, else none.
            const fits = currentCount + picked.length <= max;
            const expectedAccepted = fits ? picked.length : 0;
            expect(accepted.length).toBe(expectedAccepted);

            // rejected accounts for every picked file not accepted
            expect(rejected).toBe(picked.length - accepted.length);

            // total staged count after the add never exceeds max
            expect(currentCount + accepted.length).toBeLessThanOrEqual(max);

            // rejection occurs exactly when the pick would have overflowed the limit
            expect(rejected > 0).toBe(currentCount + picked.length > max);

            // accepted is either the full pick (order preserved) or empty
            expect(accepted).toEqual(fits ? picked : []);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('startUpload wiring', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
      global.URL.revokeObjectURL = vi.fn();
    });

    it('after an add the staged count <= max and a toast is raised iff trimming occurred', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 12 }), // max
          fc.integer({ min: 0, max: 12 }), // initial staged (<= max)
          fc.integer({ min: 0, max: 15 }), // picked
          async (max, initialRaw, pickedCount) => {
            const initialCount = Math.min(initialRaw, max);

            // The manager resolves the per-batch max from the SDK asynchronously on
            // mount; mock that value, then wait below for the resolution to land so
            // the enforced limit is deterministic.
            mockCometChat.getMaxAttachmentCount = vi.fn().mockResolvedValue(max);

            // The manager mints its own fileIds now and drives the default mock
            // upload request (createUploadFileRequest); no per-call mock needed.
            const { result, unmount } = renderHook(() => useHarness());
            // Wait for the async SDK max to resolve before staging anything.
            await waitFor(() => {
              expect(result.current.manager.maxAttachmentCount).toBe(max);
            });

            // Seed the tray with `initialCount` items (within the limit -> no toast).
            if (initialCount > 0) {
              act(() => {
                result.current.manager.startUpload(makeFiles(initialCount));
              });
            }
            expect(result.current.state.showValidationError).toBe(false);
            expect(result.current.state.tray.items).toHaveLength(initialCount);

            // Add the picked batch and enforce the limit.
            act(() => {
              result.current.manager.startUpload(makeFiles(pickedCount));
            });

            const staged = result.current.state.tray.items.length;
            const rejected = initialCount + pickedCount > max;

            // Invariant: total staged count never exceeds max.
            expect(staged).toBeLessThanOrEqual(max);
            // All-or-nothing: the whole pick is added only if it fits; otherwise the
            // tray is left unchanged at its initial count.
            expect(staged).toBe(
              initialCount + pickedCount <= max ? initialCount + pickedCount : initialCount
            );
            // Toast is raised exactly when the batch was rejected for overflow.
            expect(result.current.state.showValidationError).toBe(rejected);
            if (rejected) {
              expect(result.current.state.validationErrorText).toBe('attachment_count_exceeded');
            }

            unmount();
          }
        ),
        { numRuns: 100 }
      );
      // 100 property runs, each a full renderHook + async SDK-max resolution; give
      // it headroom over the 5s default so it doesn't flake under full-suite load.
    }, 20000);
  });
});
