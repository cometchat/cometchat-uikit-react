import React from 'react';
import {CometChatConversations} from "../src/components";

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