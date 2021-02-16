import { CometChat } from "@cometchat-pro/chat";

import * as enums from "../../../util/enums.js";

export class CallAlertManager {

    callListenerId = "incoming_call_" + new Date().getTime();

    attachListeners(callback) {

        CometChat.addCallListener(
            this.callListenerId,
            new CometChat.CallListener({
                onIncomingCallReceived: call => {
                    callback(enums.INCOMING_CALL_RECEIVED, call);
                },
                onIncomingCallCancelled: call => {
                    callback(enums.INCOMING_CALL_CANCELLED, call);
                }
            })
        );
    }

    removeListeners() {
        CometChat.removeCallListener(this.callListenerId);
    }
}