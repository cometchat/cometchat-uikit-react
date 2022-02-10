import React from 'react';

import { CometChatListBase} from '../CometChatWorkspace/src/components/Shared/';

export default {
    title: 'UI Kit/Shared/PrimaryComponents/CometChatListBase',
    component: CometChatListBase,
    argTypes: {
    },
  };

export const Primary = (args) => (
    <div style={{display: "flex"}}>
      <CometChatListBase {...args} />
    </div>
  );