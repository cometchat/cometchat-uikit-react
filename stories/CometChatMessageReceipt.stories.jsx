import React from 'react';
import { CometChatMessageReceipt } from '../CometChatWorkspace/src/components/Shared/SecondaryComponents/CometChatMessageReceipt';

const message = {
    "data": {
     "id": "1",
     "conversationId": "superhero3_user_superhero5",
     "sender": "superhero3",
     "receiverType": "user",
     "receiver": "superhero5",
     "category": "message",
     "type": "text",
     "data": {
      "text": "hello spiderman test update message",
      "entities": {
       "sender": {
        "entity": {
         "uid": "superhero3",
         "name": "Spiderman",
         "role": "default",
         "avatar": "https://data-us.cometchat.io/assets/images/avatars/spiderman.png",
         "status": "offline",
         "createdAt": 1638361550
        },
        "entityType": "user"
       },
       "receiver": {
        "entity": {
         "uid": "superhero5",
         "name": "Cyclops",
         "role": "default",
         "avatar": "https://data-us.cometchat.io/assets/images/avatars/cyclops.png",
         "status": "offline",
         "createdAt": 1638361550,
         "conversationId": "superhero3_user_superhero5"
        },
        "entityType": "user"
       }
      },
      "metadata": {
       "key1": "val1"
      }
     },
     "sentAt": 1638423490,
     "editedAt": 1638424503,
     "editedBy": "app_system",
     "updatedAt": 1638424503
    }
   }
  
  export default {
    title: 'UI Kit/Shared/Secondary Components/CometChatMessageReceipt',
    component: CometChatMessageReceipt,
    argTypes: {
    },
  };
  
  export const Primary = (args) => (
    <div style={{display: "flex"}}>
      <CometChatMessageReceipt {...args}
        messageObject = {message}
      />
    </div>
  );