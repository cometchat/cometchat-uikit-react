import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatChangeScope } from './CometChatChangeScope';
import type { CometChatChangeScopeOptionData } from './CometChatChangeScope.types';
import { LocaleProvider } from '../../../context/locale/LocaleProvider';

const scopeOptions: CometChatChangeScopeOptionData[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'moderator', label: 'Moderator' },
  { id: 'participant', label: 'Participant' },
];

const meta: Meta = {
  title: 'Base Elements/Change Scope',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: "Allows changing a group member's role/scope (admin, moderator, participant).",
      },
    },
  },
  decorators: [
    Story => (
      <LocaleProvider locale="en-us">
        <Story />
      </LocaleProvider>
    ),
  ],
};
export default meta;

/** Default — three scope options with participant pre-selected. */
export const Default = () => (
  <CometChatChangeScope.Root
    options={scopeOptions}
    defaultSelection="participant"
    onScopeChanged={id => {
      console.log('Scope changed to:', id);
      return Promise.resolve();
    }}
    onClose={() => console.log('Closed')}
  >
    <CometChatChangeScope.Header />
    <CometChatChangeScope.ScopeList>
      {scopeOptions.map(opt => (
        <CometChatChangeScope.ScopeOption key={opt.id} option={opt} />
      ))}
    </CometChatChangeScope.ScopeList>
    <CometChatChangeScope.ErrorMessage />
    <CometChatChangeScope.Actions />
  </CometChatChangeScope.Root>
);
