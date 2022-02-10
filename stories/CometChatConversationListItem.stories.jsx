import React from 'react';
import {CometChatConversationListItem} from "../CometChatWorkspace/src/components/Shared/SDKDerivedComponents/CometChatConversationListItem";

const conversation = {
  "conversationId": "superhero1_user_superhero2",
  "conversationType": "user",
  "unreadMessageCount": "2",
  "createdAt": 1637772522,
  "updatedAt": 1638519724,
  "lastMessage": {
      "id": "78",
      "conversationId": "superhero1_user_superhero2",
      "sender": "superhero1",
      "receiverType": "user",
      "receiver": "superhero2",
      "category": "message",
      "type": "audio",
      "data": {
          "url": "https://data-us.cometchat.io/198206d88b31fe2e/media/1638519724_1514392023_e742430c64090fb2c228f3cf27a86244.wav",
          "entities": {
              "sender": {
                  "entity": {
                      "uid": "superhero1",
                      "name": "Iron Man",
                      "role": "default",
                      "avatar": "https://data-us.cometchat.io/assets/images/avatars/ironman.png",
                      "status": "available",
                      "lastActiveAt": 1638519697
                  },
                  "entityType": "user"
              },
              "receiver": {
                  "entity": {
                      "uid": "superhero2",
                      "name": "Captain America",
                      "role": "default",
                      "avatar": "https://data-us.cometchat.io/assets/images/avatars/captainamerica.png",
                      "status": "offline",
                      "lastActiveAt": 1638453032,
                      "conversationId": "superhero1_user_superhero2"
                  },
                  "entityType": "user"
              }
          },
          "metadata": {
              "file": []
          },
          "resource": "WEB-3_0_2_beta1-2be414be-05fe-4a29-b77e-36ca990230a6-1638466990061",
          "attachments": [
              {
                  "url": "https://data-us.cometchat.io/198206d88b31fe2e/media/1638519724_1514392023_e742430c64090fb2c228f3cf27a86244.wav",
                  "name": "incomingcall.wav",
                  "size": 2305594,
                  "mimeType": "audio/x-wav",
                  "extension": "wav"
              }
          ]
      },
      "sentAt": 1638519724,
      "updatedAt": 1638519724,
      "parentMessageId": true
  },
  "conversationWith": {
      "uid": "superhero2",
      "name": "Captain America",
      "avatar": "https://data-us.cometchat.io/assets/images/avatars/captainamerica.png",
      "status": "online",
      "role": "default",
      "lastActiveAt": 1638453032,
      "conversationId": "superhero1_user_superhero2"
  }
}

export default {
  title: 'UI Kit/Shared/SDKDerivedComponents/CometChatConversationListItem',
  component: CometChatConversationListItem,
  argTypes: {
  },
};

export const Primary = (args) => (
    <CometChatConversationListItem
        conversation={conversation}
        key={"1"}
        {...args}
    />
);