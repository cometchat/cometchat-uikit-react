import React from 'react';
/** @jsxImportSource @emotion/react */
import {CometChatConversations} from "../CometChatWorkspace/src/components/Chats";

export default {
  title: 'UI Kit/Chats/CometChatConversations',
  component: CometChatConversations,
  argTypes: {
  },
};

export const Primary = (args) => (
  <div style={{display: "flex"}}>
    <CometChatConversations {...args} />
  </div>
);