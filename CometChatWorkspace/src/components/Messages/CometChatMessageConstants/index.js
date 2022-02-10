
import { CometChatMessageCategories } from "./CometChatMessageCategories";
import { CometChatMessageTypes } from "./CometChatMessageTypes";
import { CometChatCustomMessageTypes } from "./CometChatCustomMessageTypes";
import { CometChatCustomMessageOptions } from "./CometChatCustomMessageOptions";
import { CometChatMessageOptions } from "./CometChatMessageOptions";
import { CometChatMessageReceiverType } from "./CometChatMessageReceiverType";

const messageConstants = {
	maximumNumOfMessages: 1000,
	liveReactionTimeout: 1500
}

const wordBoundary = {
	start: `(?:^|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
	end: `(?=$|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
};

export const emailPattern = new RegExp(
	wordBoundary.start +
	`[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}` +
	wordBoundary.end,
	'gi'
); 

export const urlPattern = new RegExp(
	wordBoundary.start +
	`((https?://|www\\.|pic\\.)[-\\w;/?:@&=+$\\|\\_.!~*\\|'()\\[\\]%#,☺]+[\\w/#](\\(\\))?)` +
	wordBoundary.end,
	'gi'
);

export const phoneNumPattern = new RegExp(
	wordBoundary.start +
	`(?:\\+?(\\d{1,3}))?([-. (]*(\\d{3})[-. )]*)?((\\d{3})[-. ]*(\\d{2,4})(?:[-.x ]*(\\d+))?)` +
	wordBoundary.end,
	'gi'
);

// const CONSTANTS = {
// 	MAX_MESSAGE_COUNT: 1000,
// 	LISTENERS: {
// 		TEXT_MESSAGE_RECEIVED: "onTextMessageReceived",
// 		MEDIA_MESSAGE_RECEIVED: "onMediaMessageReceived",
// 		CUSTOM_MESSAGE_RECEIVED: "onCustomMessageReceived",
// 		MESSAGE_DELIVERED: "onMessagesDelivered",
// 		MESSAGE_READ: "onMessagesRead",
// 		MESSAGE_DELETED: "onMessageDeleted",
// 		MESSAGE_EDITED: "onMessageEdited",
// 		GROUP_MEMBER_SCOPE_CHANGED: "onGroupMemberScopeChanged",
// 		GROUP_MEMBER_KICKED: "onGroupMemberKicked",
// 		GROUP_MEMBER_BANNED: "onGroupMemberBanned",
// 		GROUP_MEMBER_UNBANNED: "onGroupMemberUnbanned",
// 		GROUP_MEMBER_ADDED: "onMemberAddedToGroup",
// 		GROUP_MEMBER_LEFT: "onGroupMemberLeft",
// 		GROUP_MEMBER_JOINED: "onGroupMemberJoined",
// 		INCOMING_CALL_RECEIVED: "onIncomingCallReceived",
// 		OUTGOING_CALL_ACCEPTED: "onOutgoingCallAccepted",
// 		OUTGOING_CALL_REJECTED: "onOutgoingCallRejected",
// 		INCOMING_CALL_CANCELLED: "onIncomingCallCancelled",
// 	},
// };

const messageAlignment = Object.freeze({
	leftAligned: "leftAligned",
	standard: "standard",
});

const messageTimeAlignment = Object.freeze({
	top: "top",
	bottom: "bottom"
});

const messageStatus = Object.freeze({
	inprogress: "inprogress",
	success: "success",
});

const messageHoverStyling = (props) => {

	let position = {};
	let direction = { flexDirection: "row" };

	if(props.messageAlignment === messageAlignment.leftAligned) {
		position = {
			top: "0",
			right: "20px",
		};
		direction = { flexDirection: "row-reverse" };

	} else if((props.loggedInUser?.uid === props.messageObjec?.sender?.uid)) {

		position = {
			top: "-20px",
			right: "28px",
		};

	} else {

		position = {
			top: "-20px",
			right: "20px",
		};

		direction = { flexDirection: "row-reverse" };
	}


	return {
		position: "absolute",
		zIndex: "1",
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-end",
		...position,
		...direction,
	};
};

const metadataKey = Object.freeze({
	file: "file",
	liveReaction: "live_reaction",
	extensions: {
		thumbnailGeneration: "thumbnail-generation",
		polls: "polls",
		document: "document",
		whiteboard: "whiteboard",
		xssfilter: "xss-filter",
		datamasking: "data-masking",
		profanityfilter: "profanity-filter",
		reactions: "reactions",
		linkpreview: "link-preview"
	},
});

const BREAKPOINTS = [
	"(min-width: 320px) and (max-width: 767px)",
	"(min-width: 320px) and (max-width: 480px)",
	"(min-width: 481px) and (max-width: 768px)",
	"(min-width: 769px) and (max-width: 1024px)",
	"(min-width: 1025px) and (max-width: 1200px)",
];

export {
	CometChatMessageReceiverType,
	messageConstants,
	messageAlignment,
	messageTimeAlignment,
	messageStatus,
	messageHoverStyling,
	metadataKey,
	BREAKPOINTS,
};

export { 
	CometChatMessageCategories, 
	CometChatMessageTypes,
	CometChatCustomMessageTypes,
	CometChatMessageOptions, 
	CometChatCustomMessageOptions 
};