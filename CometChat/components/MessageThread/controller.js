import { CometChat } from "@cometchat-pro/chat";

import * as enums from '../../util/enums.js';

export class MessageThreadManager {

    msgListenerId = "threadmessage_" + new Date().getTime();

    attachListeners(callback) {

        CometChat.addMessageListener(
            this.msgListenerId,
            new CometChat.MessageListener({
                onMessageEdited: editedMessage => {
                    callback(enums.MESSAGE_EDITED, editedMessage);
                }
            })
        );
    }

    removeListeners() {
        CometChat.removeMessageListener(this.msgListenerId);
    }
}