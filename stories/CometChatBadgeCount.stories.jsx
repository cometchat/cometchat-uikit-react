import React from 'react';

import {CometChatBadgeCount} from "../CometChatWorkspace/src/components/Shared";

const user = {
  "uid": "superhero1",
  "name": "Iron Man",
  "avatar": "https://data-us.cometchat.io/assets/images/avatars/captainamerica.png",
  "status": "offline",
  "role": "default",
  "lastActiveAt": 1644475893,
  "conversationId": "superhero1_user_superhero2"
}

export default {
  title: 'UI Kit/Shared/Secondary Components/CometChatBadgeCount',
  component: CometChatBadgeCount,
  argTypes: {
  },
};

export const Primary = (args) => (
  <div style={{display: "flex"}}>
    <CometChatBadgeCount {...args} 
    count = {104}
    />
    
  </div>
);