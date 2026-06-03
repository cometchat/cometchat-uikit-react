import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { CometChatAIAssistantChat } from './CometChatAIAssistantChat';
import { CometChatAIAssistantTools } from './ai.types';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPluginRegistryContext } from '../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../CometChatPluginRegistry';
import { defaultPlugins } from '../core';

// ============================================
// Mock SDK setup
// ============================================

// Mock CometChat.getLoggedinUser so MessageHeader and MessageList don't crash
CometChat.getLoggedinUser = () =>
  Promise.resolve({
    getUid: () => 'logged-in-user',
    getName: () => 'Me',
    getAvatar: () => '',
    getStatus: () => 'online',
    getLastActiveAt: () => 0,
    getAuthToken: () => 'mock-token',
  } as unknown as CometChat.User);

// Mock listeners
CometChat.addMessageListener = (() => {}) as typeof CometChat.addMessageListener;
CometChat.removeMessageListener = (() => {}) as typeof CometChat.removeMessageListener;
CometChat.addCallListener = (() => {}) as typeof CometChat.addCallListener;
CometChat.removeCallListener = (() => {}) as typeof CometChat.removeCallListener;
CometChat.addUserListener = (() => {}) as typeof CometChat.addUserListener;
CometChat.removeUserListener = (() => {}) as typeof CometChat.removeUserListener;
CometChat.addConnectionListener = (() => {}) as typeof CometChat.addConnectionListener;
CometChat.removeConnectionListener = (() => {}) as typeof CometChat.removeConnectionListener;
CometChat.addAIAssistantListener = (() => {}) as typeof CometChat.addAIAssistantListener;
CometChat.removeAIAssistantListener = (() => {}) as typeof CometChat.removeAIAssistantListener;

// Plugin registry for stories
const storyRegistry = new CometChatPluginRegistry(defaultPlugins);

// Mock AI assistant user
const mockUser = {
  getUid: () => 'ai-assistant-1',
  getName: () => 'AI Assistant',
  getAvatar: () => '',
  getStatus: () => 'online',
  getLastActiveAt: () => 0,
  getMetadata: () => ({
    greetingMessage: "Hi! I'm your AI assistant.",
    introductoryMessage:
      'I can help you summarize conversations, answer questions, and suggest replies.',
    suggestedMessages: [
      'Summarize this conversation',
      'What are the key points?',
      'Suggest a reply',
    ],
  }),
} as unknown as CometChat.User;

// Mock AI tools
const mockTools = new CometChatAIAssistantTools({
  getWeather: (args: Record<string, unknown>) => {
    console.log('getWeather called with:', args);
  },
  searchWeb: (args: Record<string, unknown>) => {
    console.log('searchWeb called with:', args);
  },
});

const meta: Meta<typeof CometChatAIAssistantChat> = {
  title: 'Components/AI/AI Assistant Chat',
  component: CometChatAIAssistantChat,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'AI Assistant Chat — full orchestrator component for the AI assistant chat experience. Includes MessageHeader, MessageList, MessageComposer, and ChatHistory sidebar.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    hideSuggestedMessages: {
      control: 'boolean',
      description: 'hide AI-suggested message chips above the composer.',
    },
    hideChatHistory: {
      control: 'boolean',
      description: 'Hide the chat history sidebar toggle.',
    },
    hideNewChat: {
      control: 'boolean',
      description: 'Hide the "New Chat" button in the header.',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Show the close button in the header.',
    },
  },
  decorators: [
    Story => (
      <CometChatPluginRegistryContext.Provider value={storyRegistry}>
        <div
          className="cometchat"
          style={{
            width: 600,
            height: 700,
            border: '1px solid #e8e8e8',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <Story />
        </div>
      </CometChatPluginRegistryContext.Provider>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof CometChatAIAssistantChat>;

export const Default: Story = {
  args: {
    user: mockUser,
    streamingSpeed: 30,
    hideSuggestedMessages: false,
    hideChatHistory: false,
    hideNewChat: false,
    showCloseButton: true,
    onCloseButtonClicked: () => console.log('Close clicked'),
    onError: (err: unknown) => console.error('Error:', err),
  },
};

export const WithTools: Story = {
  args: {
    ...Default.args,
    aiAssistantTools: mockTools,
  },
};

export const WithoutHistory: Story = {
  args: {
    ...Default.args,
    hideChatHistory: true,
    hideNewChat: true,
  },
};

export const WithCustomSuggestions: Story = {
  args: {
    ...Default.args,
    suggestedMessages: [
      'What happened in the last meeting?',
      'Draft a follow-up email',
      'List action items',
      'Translate to Spanish',
    ],
  },
};
