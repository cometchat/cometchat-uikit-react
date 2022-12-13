import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatContext } from "../../../util/CometChatContext";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import { actionMessageStyle, actionMessageTxtStyle } from "./style";

class CometChatActionMessageBubble extends React.Component {
	static contextType = CometChatContext;
	loggedInUser;

	constructor(props, context) {
		super(props, context);

		this.context.getLoggedinUser().then((user) => {
			this.loggedInUser = { ...user };
		});
	}

	getCallActionMessage = (message) => {
		const call = message;
		let actionMessage = null;

		switch (call.status) {
			case CometChat.CALL_STATUS.INITIATED: {
				actionMessage = Translator.translate(
					"CALL_INITIATED",
					this.context.language
				);
				if (call.type === CometChat.CALL_TYPE.AUDIO) {
					if (call.receiverType === CometChat.RECEIVER_TYPE.USER) {
						actionMessage =
							call.callInitiator.uid === this.loggedInUser?.uid
								? Translator.translate(
										"OUTGOING_AUDIO_CALL",
										this.context.language
								  )
								: Translator.translate(
										"INCOMING_AUDIO_CALL",
										this.context.language
								  );
					} else if (call.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
						if (call.action === CometChat.CALL_STATUS.INITIATED) {
							actionMessage =
								call.callInitiator.uid === this.loggedInUser?.uid
									? Translator.translate(
											"OUTGOING_AUDIO_CALL",
											this.context.language
									  )
									: Translator.translate(
											"INCOMING_AUDIO_CALL",
											this.context.language
									  );
						} else if (call.action === CometChat.CALL_STATUS.REJECTED) {
							actionMessage =
								call.sender.uid === this.loggedInUser?.uid
									? Translator.translate("CALL_REJECTED", this.context.language)
									: `${call.sender.name} ${Translator.translate(
											"REJECTED_CALL",
											this.context.language
									  )}`;
						}
					}
				} else if (call.type === CometChat.CALL_TYPE.VIDEO) {
					if (call.receiverType === CometChat.RECEIVER_TYPE.USER) {
						actionMessage =
							call.callInitiator.uid === this.loggedInUser?.uid
								? Translator.translate(
										"OUTGOING_VIDEO_CALL",
										this.context.language
								  )
								: Translator.translate(
										"INCOMING_VIDEO_CALL",
										this.context.language
								  );
					} else if (call.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
						if (call.action === CometChat.CALL_STATUS.INITIATED) {
							actionMessage =
								call.callInitiator.uid === this.loggedInUser?.uid
									? Translator.translate(
											"OUTGOING_VIDEO_CALL",
											this.context.language
									  )
									: Translator.translate(
											"INCOMING_VIDEO_CALL",
											this.context.language
									  );
						} else if (call.action === CometChat.CALL_STATUS.REJECTED) {
							actionMessage =
								call.sender.uid === this.loggedInUser?.uid
									? Translator.translate("CALL_REJECTED", this.context.language)
									: `${call.sender.name} ${Translator.translate(
											"REJECTED_CALL",
											this.context.language
									  )}`;
						}
					}
				}
				break;
			}
			case CometChat.CALL_STATUS.ONGOING: {
				if (call.receiverType === CometChat.RECEIVER_TYPE.USER) {
					actionMessage = Translator.translate(
						"CALL_ACCEPTED",
						this.context.language
					);
				} else if (call.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
					if (call.action === CometChat.CALL_STATUS.ONGOING) {
						actionMessage =
							call.sender.uid === this.loggedInUser?.uid
								? Translator.translate("CALL_ACCEPTED", this.context.language)
								: `${call.sender.name} ${Translator.translate(
										"JOINED",
										this.context.language
								  )}`;
					} else if (call.action === CometChat.CALL_STATUS.REJECTED) {
						actionMessage =
							call.sender.uid === this.loggedInUser?.uid
								? Translator.translate("CALL_REJECTED", this.context.language)
								: `${call.sender.name} ${Translator.translate(
										"REJECTED_CALL",
										this.context.language
								  )}`;
					} else if (call.action === "left") {
						if (call.sender.uid === this.loggedInUser?.uid) {
							actionMessage = `${Translator.translate(
								"YOU",
								this.context.language
							)} ${Translator.translate(
								"LEFT_THE_CALL",
								this.context.language
							)}`;
						} else {
							actionMessage = `${call.sender.name} ${Translator.translate(
								"LEFT_THE_CALL",
								this.context.language
							)}`;
						}
					}
				}
				break;
			}
			case CometChat.CALL_STATUS.UNANSWERED: {
				actionMessage = Translator.translate(
					"CALL_UNANSWERED",
					this.context.language
				);

				if (
					call.type === CometChat.CALL_TYPE.AUDIO &&
					(call.receiverType === CometChat.RECEIVER_TYPE.USER ||
						call.receiverType === CometChat.RECEIVER_TYPE.GROUP)
				) {
					actionMessage =
						call.callInitiator.uid === this.loggedInUser?.uid
							? Translator.translate(
									"UNANSWERED_AUDIO_CALL",
									this.context.language
							  )
							: Translator.translate(
									"MISSED_AUDIO_CALL",
									this.context.language
							  );
				} else if (
					call.type === CometChat.CALL_TYPE.VIDEO &&
					(call.receiverType === CometChat.RECEIVER_TYPE.USER ||
						call.receiverType === CometChat.RECEIVER_TYPE.GROUP)
				) {
					actionMessage =
						call.callInitiator.uid === this.loggedInUser?.uid
							? Translator.translate(
									"UNANSWERED_VIDEO_CALL",
									this.context.language
							  )
							: Translator.translate(
									"MISSED_VIDEO_CALL",
									this.context.language
							  );
				}
				break;
			}
			case CometChat.CALL_STATUS.REJECTED:
				actionMessage = Translator.translate(
					"CALL_REJECTED",
					this.context.language
				);
				break;
			case CometChat.CALL_STATUS.ENDED:
				actionMessage = Translator.translate(
					"CALL_ENDED",
					this.context.language
				);
				break;
			case CometChat.CALL_STATUS.CANCELLED:
				actionMessage = Translator.translate(
					"CALL_CANCELLED",
					this.context.language
				);
				break;
			case CometChat.CALL_STATUS.BUSY:
				actionMessage = Translator.translate(
					"CALL_BUSY",
					this.context.language
				);
				break;
			default:
				break;
		}

		return actionMessage;
	};

	getActionMessage = (message) => {
		let actionMessage = null;

		const byUser = message?.actionBy?.name;
		const onUser = message?.actionOn?.name;

		switch (message.action) {
			case CometChat.ACTION_TYPE.MEMBER_JOINED:
				actionMessage = `${byUser} ${Translator.translate(
					"JOINED",
					this.context.language
				)}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_LEFT:
				actionMessage = `${byUser} ${Translator.translate(
					"LEFT",
					this.context.language
				)}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_ADDED:
				actionMessage = `${byUser} ${Translator.translate(
					"ADDED",
					this.context.language
				)} ${onUser}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_KICKED:
				actionMessage = `${byUser} ${Translator.translate(
					"KICKED",
					this.context.language
				)} ${onUser}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_BANNED:
				actionMessage = `${byUser} ${Translator.translate(
					"BANNED",
					this.context.language
				)} ${onUser}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_UNBANNED:
				actionMessage = `${byUser} ${Translator.translate(
					"UNBANNED",
					this.context.language
				)} ${onUser}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED: {
				const newScope = message?.newScope;
				actionMessage = `${byUser} ${Translator.translate(
					"MADE",
					this.context.language
				)} ${onUser} ${Translator.translate(newScope, this.context.language)}`;
				break;
			}
			default:
				break;
		}

		return actionMessage;
	};

	getMessage = (message) => {
		let actionMessage = null;

		if (message.category === CometChat.CATEGORY_CALL) {
			actionMessage = this.getCallActionMessage(message);
		} else if (message.category === CometChat.CATEGORY_ACTION) {
			actionMessage = this.getActionMessage(message);
		}

		return actionMessage;
	};

	render() {
		return (
			<div css={actionMessageStyle()} className='action__message'>
				<p css={actionMessageTxtStyle()}>
					{this.getMessage(this.props.message)}
				</p>
			</div>
		);
	}
}

// Specifies the default values for props:
CometChatActionMessageBubble.defaultProps = {
	theme: theme,
};

CometChatActionMessageBubble.propTypes = {
	theme: PropTypes.object,
	message: PropTypes.object.isRequired,
};

export { CometChatActionMessageBubble };
