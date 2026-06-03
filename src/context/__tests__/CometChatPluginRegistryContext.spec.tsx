import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React, { useContext } from 'react';
import { CometChatPluginRegistryContext } from '../PluginRegistryContext';
import { CometChatPluginRegistry } from '../../plugins/CometChatPluginRegistry';

function RegistryConsumer() {
  const registry = useContext(CometChatPluginRegistryContext);
  return (
    <div data-testid="value">{registry === null ? 'null' : String(registry.getAll().length)}</div>
  );
}

describe('CometChatPluginRegistryContext', () => {
  it('defaults to null when no provider is present', () => {
    render(<RegistryConsumer />);
    expect(screen.getByTestId('value').textContent).toBe('null');
  });

  it('provides registry to children', () => {
    const registry = new CometChatPluginRegistry([
      {
        id: 'test',
        messageTypes: ['test'],
        messageCategories: ['message'],
        renderBubble: () => null,
      },
    ]);

    render(
      <CometChatPluginRegistryContext.Provider value={registry}>
        <RegistryConsumer />
      </CometChatPluginRegistryContext.Provider>
    );

    expect(screen.getByTestId('value').textContent).toBe('1');
  });

  it('has the correct displayName', () => {
    expect(CometChatPluginRegistryContext.displayName).toBe('CometChatPluginRegistryContext');
  });
});
