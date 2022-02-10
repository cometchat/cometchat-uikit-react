export class CometChatSoundManager {
	
	static Sound = Object.freeze({
		incomingCall: "incomingCall",
		incomingMessage: "incomingMessage",
		incomingMessageFromOther: "incomingMessageFromOther",
		outgoingCall: "outgoingCall",
		outgoingMessage: "outgoingMessage",
	});

	static audio = null;

	static onIncomingMessage = (customSound = null) => {
		if (customSound) {
			CometChatSoundManager.audio = new Audio(customSound);
			CometChatSoundManager.audio.currentTime = 0;
			CometChatSoundManager.audio.play();
		} else {
			import("./resources/audio/incomingmessage.wav").then(response => {
				CometChatSoundManager.audio = new Audio(response.default);
				CometChatSoundManager.audio.currentTime = 0;
				CometChatSoundManager.audio.play();
			});
		}
	};

	static onIncomingOtherMessage = (customSound = null) => {
		if (customSound) {
			CometChatSoundManager.audio = new Audio(customSound);
			CometChatSoundManager.audio.currentTime = 0;
			CometChatSoundManager.audio.play();
		} else {
			import("./resources/audio/incomingothermessage.wav").then(response => {
				CometChatSoundManager.audio = new Audio(response.default);
				CometChatSoundManager.audio.currentTime = 0;
				CometChatSoundManager.audio.play();
			});
		}
	};

	static onOutgoingMessage = (customSound = null) => {
		if (customSound) {
			CometChatSoundManager.audio = new Audio(customSound);
			CometChatSoundManager.audio.currentTime = 0;
			CometChatSoundManager.audio.play();
		} else {
			import("./resources/audio/outgoingmessage.wav").then(response => {
				CometChatSoundManager.audio = new Audio(response.default);
				CometChatSoundManager.audio.currentTime = 0;
				CometChatSoundManager.audio.play();
			});
		}
	};

	static onIncomingCall = (customSound = null) => {
		if (customSound) {
			try {
				CometChatSoundManager.audio = new Audio(customSound);
				CometChatSoundManager.audio.currentTime = 0;
				if (typeof CometChatSoundManager.audio.loop == "boolean") {
					CometChatSoundManager.audio.loop = true;
				} else {
					CometChatSoundManager.audio.addEventListener(
						"ended",
						function () {
							this.currentTime = 0;
							this.play();
						},
						false,
					);
				}
				CometChatSoundManager.audio.play();
			} catch (error) {}
		} else {
			try {
				import("./resources/audio/incomingcall.wav").then(response => {
					CometChatSoundManager.audio = new Audio(response.default);
					CometChatSoundManager.audio.currentTime = 0;
					if (typeof CometChatSoundManager.audio.loop == "boolean") {
						CometChatSoundManager.audio.loop = true;
					} else {
						CometChatSoundManager.audio.addEventListener(
							"ended",
							function () {
								this.currentTime = 0;
								this.play();
							},
							false,
						);
					}
					CometChatSoundManager.audio.play();
				});
			} catch (error) {}
		}
	};

	static onOutgoingCall = (customSound = null) => {
		if (customSound) {
			try {
				CometChatSoundManager.audio = new Audio(customSound);
				CometChatSoundManager.audio.currentTime = 0;
				if (typeof CometChatSoundManager.audio.loop == "boolean") {
					CometChatSoundManager.audio.loop = true;
				} else {
					CometChatSoundManager.audio.addEventListener(
						"ended",
						function () {
							this.currentTime = 0;
							this.play();
						},
						false,
					);
				}
				CometChatSoundManager.audio.play();
			} catch (error) {}
		} else {
			try {
				import("./resources/audio/outgoingcall.wav").then(response => {
					CometChatSoundManager.audio = new Audio(response.default);
					CometChatSoundManager.audio.currentTime = 0;
					if (typeof CometChatSoundManager.audio.loop == "boolean") {
						CometChatSoundManager.audio.loop = true;
					} else {
						CometChatSoundManager.audio.addEventListener(
							"ended",
							function () {
								this.currentTime = 0;
								this.play();
							},
							false,
						);
					}
					CometChatSoundManager.audio.play();
				});
			} catch (error) {}
		}
	};

	static handlers = {
		incomingCall: CometChatSoundManager.onIncomingCall,
		outgoingCall: CometChatSoundManager.onOutgoingCall,
		incomingMessage: CometChatSoundManager.onIncomingMessage,
		incomingMessageFromOther: CometChatSoundManager.onIncomingOtherMessage,
		outgoingMessage: CometChatSoundManager.onOutgoingMessage,
	};

	static play(sound, customSound = null) {
		const resource = CometChatSoundManager.Sound[sound];
		const handler = CometChatSoundManager.handlers[resource];
		if (!handler) {
			return false;
		}

		return handler(customSound);
	}

	static pause() {
		if (CometChatSoundManager.audio) {
			CometChatSoundManager.audio.pause();
		}
	}
}
