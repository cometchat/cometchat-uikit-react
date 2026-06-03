import { describe, it, expect } from 'vitest';
import { CometChatMessageList } from '../CometChatMessageList';
import { useCometChatMessageList } from '../useCometChatMessageList';
import { useCometChatMessageListContext } from '../CometChatMessageList.context';
import {
  CometChatMessageListAlignment,
  initialMessageListState,
} from '../CometChatMessageList.types';

describe('CometChatMessageList namespace', () => {
  it('exposes all subcomponents', () => {
    expect(CometChatMessageList.Root).toBeDefined();
    expect(CometChatMessageList.View).toBeDefined();
    expect(CometChatMessageList.Header).toBeDefined();
    expect(CometChatMessageList.Footer).toBeDefined();
    expect(CometChatMessageList.ScrollToBottom).toBeDefined();
    expect(CometChatMessageList.EmptyState).toBeDefined();
    expect(CometChatMessageList.ErrorState).toBeDefined();
    expect(CometChatMessageList.LoadingState).toBeDefined();
    expect(CometChatMessageList.DateSeparator).toBeDefined();
  });

  it('is callable as a flat API component', () => {
    expect(typeof CometChatMessageList).toBe('function');
    expect(CometChatMessageList.Root).toBe(CometChatMessageList.Root);
  });
});

describe('CometChatMessageList public exports', () => {
  it('exports the orchestration hook', () => {
    expect(useCometChatMessageList).toBeDefined();
    expect(typeof useCometChatMessageList).toBe('function');
  });

  it('exports the context consumer hook', () => {
    expect(useCometChatMessageListContext).toBeDefined();
    expect(typeof useCometChatMessageListContext).toBe('function');
  });

  it('exports the alignment enum with the expected ordinals', () => {
    expect(CometChatMessageListAlignment.standard).toBe(1);
    expect(CometChatMessageListAlignment.left).toBe(0);
  });

  it('exports the initial reducer state', () => {
    expect(initialMessageListState).toBeDefined();
    expect(initialMessageListState.messages).toEqual([]);
  });
});
