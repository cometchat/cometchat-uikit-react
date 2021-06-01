import * as enums from "./enums";

export class SoundManager {
	static widgetSettings;
	static incomingCallAudio = null;
	static outgoingCallAudio = null;
	static incomingMessageAudio = null;
	static outgoingMessageAudio = null;
	static incomingOtherMessageAudio = null;

	static play = (action, context) => {
		switch (action) {
			case enums.CONSTANTS.AUDIO["INCOMING_CALL"]:
				this.onIncomingCall(context);
				break;
			case enums.CONSTANTS.AUDIO["OUTGOING_CALL"]:
				this.onOutgoingCall(context);
				break;
			case enums.CONSTANTS.AUDIO["INCOMING_MESSAGE"]:
				this.onIncomingMessage(context);
				break;
			case enums.CONSTANTS.AUDIO["INCOMING_OTHER_MESSAGE"]:
				this.onIncomingOtherMessage(context);
				break;
			case enums.CONSTANTS.AUDIO["OUTGOING_MESSAGE"]:
				this.onOutgoingMessage(context);
				break;
			default:
				break;
		}
	};

	static pause = (action, context) => {
		switch (action) {
			case enums.CONSTANTS.AUDIO["INCOMING_CALL"]:
				this.pauseIncomingCall(context);
				break;
			case enums.CONSTANTS.AUDIO["OUTGOING_CALL"]:
				this.pauseOutgoingCall(context);
				break;
			case enums.CONSTANTS.AUDIO["INCOMING_MESSAGE"]:
			case enums.CONSTANTS.AUDIO["INCOMING_OTHER_MESSAGE"]:
			case enums.CONSTANTS.AUDIO["OUTGOING_MESSAGE"]:
			default:
				break;
		}
	};

	static onIncomingMessage = context => {
		this.enableSoundForMessages(context).then(response => {
			if (response === true) {
				if (this.incomingMessageAudio === null) {
					import("../resources/audio/incomingmessage.wav").then(response => {
						this.incomingMessageAudio = new Audio(response.default);
						this.playMessageAlert(this.incomingMessageAudio);
					});
				} else {
					this.playMessageAlert(this.incomingMessageAudio);
				}
			}
		});
	};

	static onIncomingOtherMessage = context => {
		this.enableSoundForMessages(context).then(response => {
			if (response === true) {
				if (this.incomingOtherMessageAudio === null) {
					import("../resources/audio/incomingothermessage.wav").then(response => {
						this.incomingOtherMessageAudio = new Audio(response.default);
						this.playMessageAlert(this.incomingOtherMessageAudio);
					});
				} else {
					this.playMessageAlert(this.incomingOtherMessageAudio);
				}
			}
		});
	};

	static onOutgoingMessage = context => {
		this.enableSoundForMessages(context).then(response => {
			if (response === true) {
				if (this.outgoingMessageAudio === null) {
					import("../resources/audio/outgoingmessage.wav").then(response => {
						this.outgoingMessageAudio = new Audio(response.default);
						this.playMessageAlert(this.outgoingMessageAudio);
					});
				} else {
					this.playMessageAlert(this.outgoingMessageAudio);
				}
			}
		});
	};

	static playMessageAlert = messageAudio => {
		messageAudio.currentTime = 0;
		messageAudio.play();
	};

	static onIncomingCall = context => {
		this.enableSoundForCalls(context).then(response => {
			if (response === true) {
				if (this.incomingCallAudio === null) {
					import("../resources/audio/incomingcall.wav").then(response => {
						this.incomingCallAudio = new Audio(response.default);
						this.playCallAlert(this.incomingCallAudio);
					});
				} else {
					this.playCallAlert(this.incomingCallAudio);
				}
			}
		});
	};

	static onOutgoingCall = context => {
		this.enableSoundForCalls(context).then(response => {
			if (response === true) {
				if (this.outgoingCallAudio === null) {
					import("../resources/audio/outgoingcall.wav").then(response => {
						this.outgoingCallAudio = new Audio(response.default);
						this.playCallAlert(this.outgoingCallAudio);
					});
				} else {
					this.playCallAlert(this.outgoingCallAudio);
				}
			}
		});
	};

	static playCallAlert = callAudio => {
		try {
			callAudio.currentTime = 0;
			if (typeof callAudio.loop == "boolean") {
				callAudio.loop = true;
			} else {
				callAudio.addEventListener(
					"ended",
					function () {
						this.currentTime = 0;
						this.play();
					},
					false,
				);
			}
			callAudio.play();
		} catch (error) {}
	};

	static pauseIncomingCall = context => {
		this.enableSoundForCalls(context).then(response => {
			if (response === true) {
				if (this.incomingCallAudio) {
					this.incomingCallAudio.pause();
				}
			}
		});
	};

	static pauseOutgoingCall = context => {
		this.enableSoundForCalls(context).then(response => {
			if (response === true) {
				if (this.outgoingCallAudio) {
					this.outgoingCallAudio.pause();
				}
			}
		});
	};

	static enableSoundForCalls = context => {
		return new Promise(resolve => {
			context.FeatureRestriction.isCallsSoundEnabled()
				.then(response => resolve(response))
				.catch(error => resolve(false));
		});
	};

	static enableSoundForMessages = context => {
		return new Promise(resolve => {
			context.FeatureRestriction.isMessagesSoundEnabled()
				.then(response => resolve(response))
				.catch(error => resolve(false));
		});
	};
}