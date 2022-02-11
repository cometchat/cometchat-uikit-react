import React from 'react';

import {CometChatMessageHeader} from "../CometChatWorkspace/src/components/Messages";

const user = {
  "uid": "superhero2",
  "name": "Captain America",
  "avatar": "https://data-us.cometchat.io/assets/images/avatars/captainamerica.png",
  "status": "offline",
  "role": "default",
  "lastActiveAt": 1637693355,
  "conversationId": "superhero1_user_superhero2"
}

export default {
  title: 'UI Kit/Messages/CometChatMessageHeader',
  component: CometChatMessageHeader,
  argTypes: {
  },
};

export const Primary = (args) => (
  <div style={{display: "flex", width: "100%"}}>
    <CometChatMessageHeader user={user} {...args} />
  </div>
);