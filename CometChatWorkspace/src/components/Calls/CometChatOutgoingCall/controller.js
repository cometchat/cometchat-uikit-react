import { CometChat } from "@cometchat-pro/chat";

import * as enums from "../../../util/enums.js";

export class CallScreenManager {

	callListenerId = "callscreen_" + new Date().getTime();

	attachListeners(callback) {

		CometChat.addCallListener(
			this.callListenerId,
			new CometChat.CallListener({
				onOutgoingCallAccepted: call => {
					callback(enums.OUTGOING_CALL_ACCEPTED, call);
				},
				onOutgoingCallRejected: call => {
					callback(enums.OUTGOING_CALL_REJECTED, call);
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