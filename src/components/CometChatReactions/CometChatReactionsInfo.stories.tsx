/**
 * CometChatReactionInfo Storybook Stories
 *
 * Demonstrates the reaction info tooltip showing who reacted:
 * - Default (loaded with names)
 * - Many reactors (with overflow)
 * - Single reactor
 * - Loading state
 *
 * @module components/CometChatReactions/CometChatReactionInfo
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import styles from './CometChatReactions.module.css';

// ============================================
// Simulated UI (component needs SDK context)
// ============================================

function SimulatedReactionInfo({
  emoji,
  names,
  total,
  state = 'loaded',
}: {
  emoji: string;
  names: string[];
  total: number;
  state?: 'loading' | 'loaded' | 'error';
}) {
  const pendingCount = total - names.length;

  return (
    <div className={styles['cometchat-reactions__info']} role="tooltip">
      <div className={styles['cometchat-reactions__info-content']}>
        {state === 'loading' && <div className={styles['cometchat-reactions__info-loading']} />}
        {state === 'error' && (
          <div className={styles['cometchat-reactions__info-error']}>Failed to load</div>
        )}
        {state === 'loaded' && (
          <div className={styles['cometchat-reactions__info-emoji-text']}>
            <span className={styles['cometchat-reactions__info-emoji']}>{emoji}</span>
            <div>
              <div className={styles['cometchat-reactions__info-title']}>
                {names.join(', ')}
                {pendingCount > 0 && ` and ${String(pendingCount)} others`}
              </div>
              <div className={styles['cometchat-reactions__info-description']}>reacted</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta = {
  title: 'Components/Misc/Reaction Info',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a tooltip showing who reacted with a specific emoji. Shows "You" for the logged-in user and "and X others" when the count exceeds the fetch limit.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

// ============================================
// Stories
// ============================================

/** Default — loaded with three reactor names. */
export const Default: Story = {
  render: () => <SimulatedReactionInfo emoji="👍" names={['You', 'Alice', 'Bob']} total={3} />,
};

/** Many reactors with "and X others" overflow. */
export const ManyReactors: Story = {
  render: () => <SimulatedReactionInfo emoji="❤️" names={['Diana', 'Eve', 'Frank']} total={7} />,
};

/** Single reactor. */
export const SingleReactor: Story = {
  render: () => <SimulatedReactionInfo emoji="😂" names={['Grace']} total={1} />,
};

/** Loading state. */
export const Loading: Story = {
  render: () => <SimulatedReactionInfo emoji="👍" names={[]} total={0} state="loading" />,
};

/** Error state. */
export const ErrorState: Story = {
  render: () => <SimulatedReactionInfo emoji="👍" names={[]} total={0} state="error" />,
};

/** All variants showcase. */
export const AllVariantsShowcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SimulatedReactionInfo emoji="👍" names={['You', 'Alice', 'Bob']} total={3} />
      <SimulatedReactionInfo emoji="❤️" names={['Diana', 'Eve', 'Frank']} total={7} />
      <SimulatedReactionInfo emoji="😂" names={['Grace']} total={1} />
      <SimulatedReactionInfo emoji="👍" names={[]} total={0} state="loading" />
      <SimulatedReactionInfo emoji="👍" names={[]} total={0} state="error" />
    </div>
  ),
};
