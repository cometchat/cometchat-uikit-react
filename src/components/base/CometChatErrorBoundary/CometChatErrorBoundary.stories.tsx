import React, { useState } from 'react';
import type { Meta } from '@storybook/react';
import { CometChatErrorBoundary } from './CometChatErrorBoundary';

const meta: Meta = {
  title: 'Components/Misc/Error Boundary',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Catches React rendering errors and displays a fallback error UI.',
      },
    },
  },
};
export default meta;

/** A child component that throws during render when `shouldThrow` is true. */
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Simulated render error');
  }
  return (
    <div
      style={{
        padding: 'var(--cometchat-padding-4, 16px)',
        font: 'var(--cometchat-font-body-regular, 400 14px Roboto)',
        color: 'var(--cometchat-text-color-primary, #141414)',
        background: 'var(--cometchat-background-color-02, #f5f5f5)',
        borderRadius: 'var(--cometchat-radius-2, 8px)',
      }}
    >
      Child content rendered successfully.
    </div>
  );
}

/** Default — no error, child content rendered normally. */
export const Default = () => (
  <CometChatErrorBoundary.Root componentName="SampleComponent">
    <ThrowingChild shouldThrow={false} />
  </CometChatErrorBoundary.Root>
);

/** Error state with default fallback UI. */
export const ErrorState = () => (
  <CometChatErrorBoundary.Root
    componentName="MessageBubble"
    onError={ctx => console.log('Error caught:', ctx)}
  >
    <ThrowingChild shouldThrow={true} />
  </CometChatErrorBoundary.Root>
);

/** Error state with custom fallback view. */
export const CustomFallback = () => (
  <CometChatErrorBoundary.Root
    componentName="MessageBubble"
    fallbackView={(ctx, retry) => (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ color: 'var(--cometchat-error-color, #F44336)', margin: '0 0 12px' }}>
          Custom error in {ctx.componentName}: {ctx.error.message}
        </p>
        <button
          onClick={retry}
          style={{
            font: 'var(--cometchat-font-button-medium, 500 14px Roboto)',
            color: '#fff',
            background: 'var(--cometchat-error-color, #F44336)',
            border: 'none',
            borderRadius: 'var(--cometchat-radius-2, 8px)',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    )}
  >
    <ThrowingChild shouldThrow={true} />
  </CometChatErrorBoundary.Root>
);

/** Interactive demo — trigger error and retry. */
export const InteractiveDemo = () => {
  const [key, setKey] = useState(0);
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CometChatErrorBoundary.Root
        key={key}
        componentName="InteractiveWidget"
        onError={ctx => console.log('Error:', ctx)}
      >
        <ThrowingChild shouldThrow={shouldThrow} />
      </CometChatErrorBoundary.Root>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setShouldThrow(true)}
          style={{
            font: 'var(--cometchat-font-button-medium, 500 14px Roboto)',
            color: '#fff',
            background: 'var(--cometchat-error-color, #F44336)',
            border: 'none',
            borderRadius: 'var(--cometchat-radius-2, 8px)',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          Trigger Error
        </button>
        <button
          onClick={() => {
            setShouldThrow(false);
            setKey(k => k + 1);
          }}
          style={{
            font: 'var(--cometchat-font-button-medium, 500 14px Roboto)',
            color: '#fff',
            background: 'var(--cometchat-primary-button-background-color, #6852D6)',
            border: 'none',
            borderRadius: 'var(--cometchat-radius-2, 8px)',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

/** Nested error boundaries — inner error does not affect outer. */
export const NestedBoundaries = () => (
  <CometChatErrorBoundary.Root componentName="OuterContainer">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CometChatErrorBoundary.Root componentName="ChildA">
        <ThrowingChild shouldThrow={false} />
      </CometChatErrorBoundary.Root>
      <CometChatErrorBoundary.Root componentName="ChildB">
        <ThrowingChild shouldThrow={true} />
      </CometChatErrorBoundary.Root>
      <CometChatErrorBoundary.Root componentName="ChildC">
        <ThrowingChild shouldThrow={false} />
      </CometChatErrorBoundary.Root>
    </div>
  </CometChatErrorBoundary.Root>
);
