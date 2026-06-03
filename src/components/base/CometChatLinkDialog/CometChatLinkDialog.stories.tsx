import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatLinkDialog } from './CometChatLinkDialog';

const meta: Meta<typeof CometChatLinkDialog> = {
  title: 'Components/Misc/Link Dialog',
  component: CometChatLinkDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A dialog for inserting hyperlinks with URL and display text fields.',
      },
    },
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj<typeof CometChatLinkDialog>;

/** Add mode with empty fields. */
export const Default: Story = {
  render: () => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      return visible ? (
        <CometChatLinkDialog
          mode="add"
          onSave={({ text, url }) => {
            console.log('Save:', text, url);
            setVisible(false);
          }}
          onCancel={() => setVisible(false)}
        />
      ) : (
        <button onClick={() => setVisible(true)}>Show dialog again</button>
      );
    }
    return <Demo />;
  },
};

/** Edit mode with pre-filled text and URL. */
export const EditMode: Story = {
  render: () => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      return visible ? (
        <CometChatLinkDialog
          mode="edit"
          initialText="CometChat Docs"
          initialUrl="https://www.cometchat.com/docs"
          onSave={({ text, url }) => {
            console.log('Save:', text, url);
            setVisible(false);
          }}
          onCancel={() => setVisible(false)}
        />
      ) : (
        <button onClick={() => setVisible(true)}>Show dialog again</button>
      );
    }
    return <Demo />;
  },
};

/** Add mode with selected text and pre-filled URL. */
export const AddWithSelectedText: Story = {
  render: () => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      return visible ? (
        <CometChatLinkDialog
          mode="add"
          selectedText="Visit Example"
          initialUrl="https://example.com"
          onSave={({ text, url }) => {
            console.log('Save:', text, url);
            setVisible(false);
          }}
          onCancel={() => setVisible(false)}
        />
      ) : (
        <button onClick={() => setVisible(true)}>Show dialog again</button>
      );
    }
    return <Demo />;
  },
};

/** Showcase of all variants. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 11, color: '#999' }}>Add Mode (Empty)</p>
        <CometChatLinkDialog mode="add" onSave={() => {}} onCancel={() => {}} />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 11, color: '#999' }}>Edit Mode (Pre-filled)</p>
        <CometChatLinkDialog
          mode="edit"
          initialText="CometChat Docs"
          initialUrl="https://www.cometchat.com/docs"
          onSave={() => {}}
          onCancel={() => {}}
        />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 11, color: '#999' }}>
          Add Mode with Selected Text
        </p>
        <CometChatLinkDialog
          mode="add"
          selectedText="Visit Example"
          initialUrl="https://example.com"
          onSave={() => {}}
          onCancel={() => {}}
        />
      </div>
    </div>
  ),
};
