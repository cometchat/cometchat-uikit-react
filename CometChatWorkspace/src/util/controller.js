import { CometChat } from "@cometchat-pro/chat";

export class CometChatManager {
	loggedInUser;
	isUserLoggedIn;

	getLoggedInUser() {
		let timerCounter = 10000;
		let timer = 0;

		return new Promise((resolve, reject) => {
			if (timerCounter === timer) reject(`timer reached ${timerCounter}`);

			if (this.loggedInUser) resolve(this.loggedInUser);

			if (!CometChat.isInitialized()) reject("CometChat not initialized");

			this.isUserLoggedIn = setInterval(() => {
				CometChat.getLoggedinUser().then(
					(user) => {
						this.loggedInUser = user;
						clearInterval(this.isUserLoggedIn);
						resolve(user);
					},
					(error) => {
						console.log(error);
						reject(error);
					}
				);

				timer += 100;
			}, 100);
		});
	}

	static blockUsers = (userList) => {
		let promise = new Promise((resolve, reject) => {
			CometChat.blockUsers(userList).then(
				(list) => resolve(list),
				(error) => reject(error)
			);
		});

		return promise;
	};

	static unblockUsers = (userList) => {
		let promise = new Promise((resolve, reject) => {
			CometChat.unblockUsers(userList).then(
				(list) => resolve(list),
				(error) => reject(error)
			);
		});

		return promise;
	};

	static call = (receiverID, receiverType, callType) => {
		let promise = new Promise((resolve, reject) => {
			const call = new CometChat.Call(receiverID, callType, receiverType);
			CometChat.initiateCall(call).then(
				(call) => resolve(call),
				(error) => reject(error)
			);
		});

		return promise;
	};

	static audioCall = (receiverID, receiverType, callType) => {
		let promise = new Promise((resolve, reject) => {
			const call = new CometChat.Call(receiverID, callType, receiverType);
			CometChat.initiateCall(call).then(
				(call) => resolve(call),
				(error) => reject(error)
			);
		});

		return promise;
	};

	static videoCall = (receiverID, receiverType, callType) => {
		let promise = new Promise((resolve, reject) => {
			const call = new CometChat.Call(receiverID, callType, receiverType);
			CometChat.initiateCall(call).then(
				(call) => resolve(call),
				(error) => reject(error)
			);
		});

		return promise;
	};

	static acceptCall = (sessionId) => {
		let promise = new Promise((resolve, reject) => {
			CometChat.acceptCall(sessionId).then(
				(call) => resolve(call),
				(error) => reject(error)
			);
		});

		return promise;
	};

	static rejectCall = (sessionId, rejectStatus) => {
		let promise = new Promise((resolve, reject) => {
			CometChat.rejectCall(sessionId, rejectStatus).then(
				(call) => resolve(call),
				(error) => reject(error)
			);
		});

		return promise;
	};
}

export default CometChatManager;
