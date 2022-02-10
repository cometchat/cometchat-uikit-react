import React from 'react';

import {CometChatStatusIndicator} from "../CometChatWorkspace/src/components/Shared/";

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
  title: 'UI Kit/Shared/Secondary Components/CometChatStatusIndicator',
  component: CometChatStatusIndicator,
  argTypes: {
  },
};

export const Primary = (args) => (
  <div style={{display: "flex"}}>
    <CometChatStatusIndicator {...args} />
  </div>
);