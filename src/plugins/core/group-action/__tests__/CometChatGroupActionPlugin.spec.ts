import { describe, it, expect } from 'vitest';
import { CometChatGroupActionPlugin } from '../CometChatGroupActionPlugin';
import type { CometChatMessagePluginContext } from '../../../plugin.types';
import { buildUser, buildActionMessage } from '../../../../testing/mock-builders';

const mockContext: CometChatMessagePluginContext = {
  loggedInUser: buildUser() as never,
  alignment: 'center',
  theme: 'light',
};

describe('CometChatGroupActionPlugin', () => {
  it('has id "group-action"', () => {
    expect(CometChatGroupActionPlugin.id).toBe('group-action');
  });

  it('messageTypes includes "groupMember"', () => {
    expect(CometChatGroupActionPlugin.messageTypes).toContain('groupMember');
  });

  it('messageCategories includes "action"', () => {
    expect(CometChatGroupActionPlugin.messageCategories).toContain('action');
  });

  it('renderBubble returns a React element', () => {
    const msg = buildActionMessage({ actionText: 'Alice joined' });
    const element = CometChatGroupActionPlugin.renderBubble(msg as never, mockContext);
    expect(element).not.toBeNull();
  });

  it('getOptions returns empty array', () => {
    const msg = buildActionMessage();
    const options = CometChatGroupActionPlugin.getOptions!(msg as never, mockContext);
    expect(options).toEqual([]);
  });

  it('getLastMessagePreview returns action text', () => {
    const msg = {
      actionBy: { name: 'Alice' },
      actionOn: { name: 'Alice' },
      action: 'joined',
    } as never;
    const preview = CometChatGroupActionPlugin.getLastMessagePreview!(msg, buildUser() as never);
    expect(preview).toContain('Alice');
  });

  it('getLastMessagePreview truncates at 100 chars', () => {
    const longName = 'A'.repeat(80);
    const msg = {
      actionBy: { name: longName },
      actionOn: { name: longName },
      action: 'added',
    } as never;
    const preview = CometChatGroupActionPlugin.getLastMessagePreview!(msg, buildUser() as never);
    expect(preview.length).toBeLessThanOrEqual(101); // 100 + ellipsis
  });

  it('getLastMessagePreview returns "Group action" for unparseable messages', () => {
    const msg = {} as never;
    const preview = CometChatGroupActionPlugin.getLastMessagePreview!(msg, buildUser() as never);
    expect(preview).toBe('Group action');
  });
});
