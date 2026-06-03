import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatConversationSummary } from './CometChatConversationSummary';

const meta: Meta = {
  title: 'Components/AI/Conversation Summary',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: "AI-generated summary of a conversation's key points.",
      },
    },
  },
};
export default meta;

const mockSummary =
  'The team discussed the upcoming product launch timeline. Key decisions include moving the release date to March 15th, assigning QA testing to the backend team, and scheduling a follow-up meeting for next Tuesday. Action items were distributed among team members with clear deadlines.';

const fetchSuccess = (): Promise<string> =>
  new Promise(resolve => setTimeout(() => resolve(mockSummary), 1000));

const fetchEmpty = (): Promise<string> =>
  new Promise(resolve => setTimeout(() => resolve(''), 500));

const fetchError = (): Promise<string> =>
  new Promise((_, reject) => setTimeout(() => reject(new Error('Network error')), 500));

const neverResolve = (): Promise<string> => new Promise(() => {});

/** Default — loaded state with summary text. */
export const Default = () => (
  <div style={{ width: 400 }}>
    <CometChatConversationSummary.Root
      getConversationSummary={fetchSuccess}
      onClose={() => console.log('Close')}
    >
      <CometChatConversationSummary.Header />
      <CometChatConversationSummary.Loading />
      <CometChatConversationSummary.Error />
      <CometChatConversationSummary.Empty />
      <CometChatConversationSummary.Body />
    </CometChatConversationSummary.Root>
  </div>
);

/** Loading state — shimmer bars. */
export const Loading = () => (
  <div style={{ width: 400 }}>
    <CometChatConversationSummary.Root getConversationSummary={neverResolve}>
      <CometChatConversationSummary.Header />
      <CometChatConversationSummary.Loading />
    </CometChatConversationSummary.Root>
  </div>
);

/** Error state — with error message and retry. */
export const ErrorState = () => (
  <div style={{ width: 400 }}>
    <CometChatConversationSummary.Root
      getConversationSummary={fetchError}
      onClose={() => console.log('Close')}
    >
      <CometChatConversationSummary.Header />
      <CometChatConversationSummary.Loading />
      <CometChatConversationSummary.Error message="Could not load summary" />
    </CometChatConversationSummary.Root>
  </div>
);

/** Empty state — no summary returned. */
export const EmptyState = () => (
  <div style={{ width: 400 }}>
    <CometChatConversationSummary.Root
      getConversationSummary={fetchEmpty}
      onClose={() => console.log('Close')}
    >
      <CometChatConversationSummary.Header />
      <CometChatConversationSummary.Loading />
      <CometChatConversationSummary.Empty message="No summary available" />
    </CometChatConversationSummary.Root>
  </div>
);

/** Long summary text — tests overflow/scrolling. */
export const LongSummary = () => {
  const longText =
    'The team held an extensive three-hour meeting covering multiple topics. ' +
    'First, the product roadmap was reviewed with updates on all 12 feature tracks. ' +
    'The engineering team reported progress on the new microservices architecture, noting that 7 of 10 services have been migrated. ' +
    'QA presented their test automation results showing 94% coverage across critical paths. ' +
    'The design team showcased new mockups for the dashboard redesign, receiving positive feedback from stakeholders. ' +
    'Marketing shared the go-to-market strategy for Q2, including planned webinars and blog posts. ' +
    'Customer success highlighted three enterprise accounts requiring immediate attention. ' +
    'The meeting concluded with action items assigned to each team lead with a two-week deadline. ' +
    'A follow-up sync was scheduled for next Friday to track progress on all items discussed.';

  return (
    <div style={{ width: 400 }}>
      <CometChatConversationSummary.Root
        getConversationSummary={() => Promise.resolve(longText)}
        onClose={() => console.log('Close')}
      >
        <CometChatConversationSummary.Header />
        <CometChatConversationSummary.Loading />
        <CometChatConversationSummary.Body />
      </CometChatConversationSummary.Root>
    </div>
  );
};

/** Without close button. */
export const WithoutCloseButton = () => (
  <div style={{ width: 400 }}>
    <CometChatConversationSummary.Root getConversationSummary={fetchSuccess}>
      <CometChatConversationSummary.Header showCloseButton={false} />
      <CometChatConversationSummary.Loading />
      <CometChatConversationSummary.Body />
    </CometChatConversationSummary.Root>
  </div>
);

/** Custom header title. */
export const CustomHeaderTitle = () => (
  <div style={{ width: 400 }}>
    <CometChatConversationSummary.Root
      getConversationSummary={fetchSuccess}
      onClose={() => console.log('Close')}
    >
      <CometChatConversationSummary.Header title="Chat Summary" />
      <CometChatConversationSummary.Loading />
      <CometChatConversationSummary.Body />
    </CometChatConversationSummary.Root>
  </div>
);
/** Custom error with retry button. */
export const CustomErrorWithRetry = () => (
  <div style={{ width: 400 }}>
    <CometChatConversationSummary.Root
      getConversationSummary={fetchError}
      onClose={() => console.log('Close')}
    >
      <CometChatConversationSummary.Header />
      <CometChatConversationSummary.Loading />
      <CometChatConversationSummary.Error>
        <div style={{ textAlign: 'center', padding: 16 }}>
          <p style={{ color: 'var(--cometchat-text-color-secondary)' }}>Custom error view</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </div>
      </CometChatConversationSummary.Error>
    </CometChatConversationSummary.Root>
  </div>
);
