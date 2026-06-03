import React, { useState } from 'react';
import type { Meta } from '@storybook/react';
import { CometChatCreatePoll } from './CometChatCreatePoll';

const meta: Meta = {
  title: 'Components/Misc/Create Poll',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A form for creating new poll messages with question and options.',
      },
    },
  },
};
export default meta;

/** Default create poll form. */
export const Default = () => (
  <CometChatCreatePoll
    onClose={() => console.log('Close')}
    onPollCreated={() => console.log('Created')}
    onError={err => console.error('Error:', err)}
  />
);

/** With custom title and placeholder text. */
export const CustomText = () => (
  <CometChatCreatePoll
    title="New Survey"
    questionPlaceholderText="Type your survey question..."
    answerPlaceholderText="Option"
    answerHelpText="Add your options"
    addAnswerText="Add option"
    createPollButtonText="Submit Survey"
    onClose={() => console.log('Close')}
  />
);

/** With 4 default answers. */
export const FourDefaults = () => (
  <CometChatCreatePoll defaultAnswers={4} onClose={() => console.log('Close')} />
);
/** In a modal overlay (realistic usage). */
export const InModal = () => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open Create Poll</button>
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <CometChatCreatePoll
            onClose={() => setOpen(false)}
            onPollCreated={() => {
              setOpen(false);
              alert('Poll created!');
            }}
          />
        </div>
      )}
    </div>
  );
};
