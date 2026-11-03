/**
 * Unit tests for useCometChatGroupsEvents: each group UI event maps to the right
 * groups-list action, and unrelated events are ignored.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ handler: undefined as ((event: unknown) => void) | undefined }));

vi.mock('../../../hooks/useCometChatEvents', () => ({
  useCometChatEvents: (handler: (event: unknown) => void) => {
    mocks.handler = handler;
  },
}));

import { useCometChatGroupsEvents } from '../useCometChatGroupsEvents';

const group = (guid: string, type = 'public') => ({ getGuid: () => guid, getType: () => type });

describe('useCometChatGroupsEvents', () => {
  let dispatch: ReturnType<typeof vi.fn>;

  function emit(event: Record<string, unknown>) {
    const handler = mocks.handler;
    if (!handler) throw new Error('the hook did not subscribe to UI events');
    handler(event);
  }

  beforeEach(() => {
    dispatch = vi.fn();
    renderHook(() => {
      useCometChatGroupsEvents({ dispatch });
    });
  });

  it('adds a group I created', () => {
    const g = group('g1');
    emit({ type: 'ui:group/created', group: g });
    expect(dispatch).toHaveBeenCalledWith({ type: 'ADD_GROUP', group: g });
  });

  it('removes a deleted group', () => {
    emit({ type: 'ui:group/deleted', group: group('g1') });
    expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_GROUP', groupId: 'g1' });
  });

  it('leaving a private group removes it; leaving a public one keeps it, updated', () => {
    emit({ type: 'ui:group/left', group: group('secret', 'private') });
    const open = group('open', 'public');
    emit({ type: 'ui:group/left', group: open });
    expect(dispatch.mock.calls).toEqual([
      [{ type: 'REMOVE_GROUP', groupId: 'secret' }],
      [{ type: 'UPDATE_GROUP', group: open }],
    ]);
  });

  it('member changes refresh the group', () => {
    const joined = group('g1');
    const g = group('g2');
    emit({ type: 'ui:group/member-joined', joinedGroup: joined });
    for (const type of [
      'ui:group/member-added',
      'ui:group/member-kicked',
      'ui:group/member-banned',
    ]) {
      emit({ type, group: g });
    }
    expect(dispatch.mock.calls).toEqual([
      [{ type: 'UPDATE_GROUP', group: joined }],
      [{ type: 'UPDATE_GROUP', group: g }],
      [{ type: 'UPDATE_GROUP', group: g }],
      [{ type: 'UPDATE_GROUP', group: g }],
    ]);
  });

  it('ignores other events', () => {
    emit({ type: 'ui:message/sent' });
    expect(dispatch).not.toHaveBeenCalled();
  });
});
