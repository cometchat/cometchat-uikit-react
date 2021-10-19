import tabList from "../resources/tabs.json";

export class UIKitSettings {
	widgetSettings;

	static userListFilterOptions = {
		ALL: "all_users",
		NONE: "none",
		FRIENDS: "friends",
	};

	static groupListFilterOptions = {
		PUBLIC: "public_groups",
		PASSWORD: "password_protected_groups",
		PUBLIC_AND_PASSWORD: "public_and_password_protected_groups",
	};

	static chatListFilterOptions = {
		USERS: "users",
		GROUPS: "groups",
		USERS_AND_GROUPS: "all_chats",
	};

	constructor() {
		this.customJS = "";
		this.customCSS = "";
		this.backgroundColor = "";
		this.primaryColor = "";
		this.foregroundColor = "";
		this.overrideSystemBackgroundColor = "";

		this.chatWindow = window;

		this.userListMode = UIKitSettings.userListFilterOptions["ALL"];
		this.groupInMode = UIKitSettings.groupListFilterOptions["PUBLIC_AND_PASSWORD"];
		this.chatListMode = UIKitSettings.chatListFilterOptions["USERS_AND_GROUPS"];

		this.chats = true;
		this.calls = false;
		this.users = true;
		this.groups = true;
		this.userSettings = true;
		this.tabs = Object.values(tabList);

		this.searchUsers = true;
		this.searchGroups = true;
		this.searchMessages = true;
		this.searchChats = true;

		this.unreadCount = true;

		this.publicGroup = true;
		this.privateGroup = true;
		this.passwordGroup = true;

		this.blockUser = true;
		this.viewShareMedia = true;

		this.groupCreation = true;
		this.allowDeleteGroup = true;
		this.joinOrLeaveGroup = true;
		this.viewGroupMembers = true;
		this.kickMember = true;
		this.banMember = true;
		this.allowPromoteDemoteMembers = true;
		this.allowAddMembers = true;

		this.callNotifications = true;
		this.joinLeaveNotifications = true;

		this.enableSoundForMessages = true;
		this.enableSoundForCalls = true;

		this.userVideoCall = true;
		this.groupVideoCall = true;
		this.userAudioCall = true;
		this.groupAudioCall = true;

		this.sendTypingIndicator = true;
		this.showUserPresence = true;
		this.showReadDeliveryReceipts = true;

		this.threadedChats = true;
		this.hideDeletedMessages = false;

		this.sendMessageInOneOnOne = true;
		this.sendMessageInGroup = true;
		this.editMessage = true;
		this.deleteMessage = true;
		this.replyingToMessage = true;

		this.sendEmojis = true;
		this.sendEmojisInLargerSize = true;
		this.sendGifs = false;
		this.shareCopyForwardMessage = false;
		this.sendFiles = true;
		this.sendPhotoVideos = true;
		this.sendVoiceNotes = true;
		this.sendLiveReaction = true;

		this.sendMessageReaction = true;
		this.collaborativeWhiteboard = true;
		this.collaborativeDocument = true;
		this.sendStickers = true;
		this.shareLocation = false;
		this.polls = true;
		this.messageTranslation = true;

		this.allowModeratorToDeleteMemberMessages = true;
		this.setGroupInQnaModeByModerators = false;
		this.highlightMessageFromModerators = false;
		this.emailReplies = true;
		this.smartReplies = true;
		this.callRecording = true;
		this.callLiveStreaming = true;
		this.callTranscription = true;
		this.thumbnailGeneration = true;
		this.linkPreview = true;
		this.saveMessages = true;
		this.pinMessages = true;
		this.richMediaPreview = true;
		this.voiceTranscription = true;
		this.mentions = true;
		this.xssFilter = true;
		this.profanityFilter = true;
		this.imageModeration = true;
		this.dataMasking = true;
		this.malwareScanner = true;
		this.sentimentAnalysis = true;
		this.inflightMessageModeration = true;
		this.messageHistory = true;

		this.viewProfile = true;
		this.messageInPrivate = true;

		this.showCallRecordingOption = true;
	}

	setCustomJS = customJS => {
		this.customJS = customJS;
	};

	setCustomCSS = customCSS => {
		this.customCSS = customCSS;
	};

	setTabs = tabList => {
		this.tabs = tabList;
	};

	setUserSettings = userSettings => {
		this.userSettings = userSettings;
	};

	setCalls = calls => {
		this.calls = calls;
	};

	setUsers = users => {
		this.users = users;
	};

	setChats = chats => {
		this.chats = chats;
	};

	setGroups = groups => {
		this.groups = groups;
	};

	setChatListMode = option => {
		if (!option.trim().length) {
			return false;
		}

		const chatListFilterKey = this.returnMatchedKey(UIKitSettings.chatListFilterOptions, option);
		if (chatListFilterKey) {
			this.chatListMode = UIKitSettings.chatListFilterOptions[chatListFilterKey];
		}
	};

	setUserListMode = option => {
		if (!option.trim().length) {
			return false;
		}

		const userListFilterKey = this.returnMatchedKey(UIKitSettings.userListFilterOptions, option);
		if (userListFilterKey) {
			this.userListMode = UIKitSettings.userListFilterOptions[userListFilterKey];
		}
	};

	setGroupListMode = () => {};

	setUserVideoCall = userVideoCall => {
		this.userVideoCall = userVideoCall;
	};

	setGroupVideoCall = groupVideoCall => {
		this.groupVideoCall = groupVideoCall;
	};

	setUserAudioCall = userAudioCall => {
		this.userAudioCall = userAudioCall;
	};

	setGroupAudioCall = groupAudioCall => {
		this.groupAudioCall = groupAudioCall;
	};

	setEditMessage = editMessage => {
		this.editMessage = editMessage;
	};

	setSendMessageInOneOnOne = sendMessageInOneOnOne => {
		this.sendMessageInOneOnOne = sendMessageInOneOnOne;
	};

	setSendMessageInGroup = sendMessageInGroup => {
		this.sendMessageInGroup = sendMessageInGroup;
	};

	setJoinOrLeaveGroup = joinOrLeaveGroup => {
		this.joinOrLeaveGroup = joinOrLeaveGroup;
	};

	setBlockUser = blockUser => {
		this.blockUser = blockUser;
	};

	setSendEmojis = sendEmojis => {
		this.sendEmojis = sendEmojis;
	};

	setSendEmojisInLargerSize = sendEmojisInLargerSize => {
		this.sendEmojisInLargerSize = sendEmojisInLargerSize;
	};

	setSendGifs = sendGifs => {
		this.sendGifs = sendGifs;
	};

	setShareCopyForwardMessage = shareCopyForwardMessage => {
		this.shareCopyForwardMessage = shareCopyForwardMessage;
	};

	setSendFiles = sendFiles => {
		this.sendFiles = sendFiles;
	};

	setSendPhotoVideos = sendPhotoVideos => {
		this.sendPhotoVideos = sendPhotoVideos;
	};

	setViewShareMedia = viewShareMedia => {
		this.viewShareMedia = viewShareMedia;
	};

	setEnableSoundForMessages = enableSoundForMessages => {
		this.enableSoundForMessages = enableSoundForMessages;
	};

	setEnableSoundForCalls = enableSoundForCalls => {
		this.enableSoundForCalls = enableSoundForCalls;
	};

	setSendStickers = sendStickers => {
		this.sendStickers = sendStickers;
	};

	setViewGroupMembers = viewGroupMembers => {
		this.viewGroupMembers = viewGroupMembers;
	};

	setCallNotifications = callNotifications => {
		this.callNotifications = callNotifications;
	};

	setAllowDeleteGroup = allowDeleteGroup => {
		this.allowDeleteGroup = allowDeleteGroup;
	};

	setKickMember = kickMember => {
		this.kickMember = kickMember;
	};

	setBanMember = banMember => {
		this.banMember = banMember;
	};

	setAllowPromoteDemoteMembers = allowPromoteDemoteMembers => {
		this.allowPromoteDemoteMembers = allowPromoteDemoteMembers;
	};

	setAllowAddMembers = allowAddMembers => {
		this.allowAddMembers = allowAddMembers;
	};

	setShareLocation = shareLocation => {
		this.shareLocation = shareLocation;
	};

	setJoinLeaveNotifications = joinLeaveNotifications => {
		this.joinLeaveNotifications = joinLeaveNotifications;
	};

	setSendVoiceNotes = sendVoiceNotes => {
		this.sendVoiceNotes = sendVoiceNotes;
	};

	setMessageTranslation = messageTranslation => {
		this.messageTranslation = messageTranslation;
	};

	setGroupCreation = groupCreation => {
		this.groupCreation = groupCreation;
	};

	setSendTypingIndicator = sendTypingIndicator => {
		this.sendTypingIndicator = sendTypingIndicator;
	};

	setShowUserPresence = showUserPresence => {
		this.showUserPresence = showUserPresence;
	};

	setDeleteMessage = deleteMessage => {
		this.deleteMessage = deleteMessage;
	};

	setThreadedChats = threadedChats => {
		this.threadedChats = threadedChats;
	};

	setReplyingToMessage = replyingToMessage => {
		this.replyingToMessage = replyingToMessage;
	};

	setShowReadDeliveryReceipts = showReadDeliveryReceipts => {
		this.showReadDeliveryReceipts = showReadDeliveryReceipts;
	};

	setHideDeletedMessages = hideDeletedMessages => {
		this.hideDeletedMessages = hideDeletedMessages;
	};

	setEmailReplies = emailReplies => {
		this.emailReplies = emailReplies;
	};

	setSendMessageReaction = sendMessageReaction => {
		this.sendMessageReaction = sendMessageReaction;
	};

	setCollaborativeWhiteboard = collaborativeWhiteboard => {
		this.collaborativeWhiteboard = collaborativeWhiteboard;
	};

	setCollaborativeDocument = collaborativeDocument => {
		this.collaborativeDocument = collaborativeDocument;
	};

	setPolls = polls => {
		this.polls = polls;
	};

	setSendLiveReaction = sendLiveReaction => {
		this.sendLiveReaction = sendLiveReaction;
	};

	setPublicGroup = publicGroup => {
		this.publicGroup = publicGroup;
	};

	setPrivateGroup = privateGroup => {
		this.privateGroup = privateGroup;
	};

	setPasswordGroup = passwordGroup => {
		this.passwordGroup = passwordGroup;
	};

	setAllowModeratorToDeleteMemberMessages = allowModeratorToDeleteMemberMessages => {
		this.allowModeratorToDeleteMemberMessages = allowModeratorToDeleteMemberMessages;
	};

	setUnreadCount = unreadCount => {
		this.unreadCount = unreadCount;
	};

	setSmartReplies = smartReplies => {
		this.smartReplies = smartReplies;
	};

	setSearchUsers = searchUsers => {
		this.searchUsers = searchUsers;
	};

	setSearchGroups = searchGroups => {
		this.searchGroups = searchGroups;
	};

	setSearchMessages = searchMessages => {
		this.searchMessages = searchMessages;
	};

	setCallRecording = callRecording => {
		this.callRecording = callRecording;
	};

	setCallLiveStreaming = callLiveStreaming => {
		this.callLiveStreaming = callLiveStreaming;
	};

	setCallTranscription = callTranscription => {
		this.callTranscription = callTranscription;
	};

	setThumbnailGeneration = thumbnailGeneration => {
		this.thumbnailGeneration = thumbnailGeneration;
	};

	setLinkPreview = linkPreview => {
		this.linkPreview = linkPreview;
	};

	setSaveMessages = saveMessages => {
		this.saveMessages = saveMessages;
	};

	setPinMessages = pinMessages => {
		this.pinMessages = pinMessages;
	};

	setRichMediaPreview = richMediaPreview => {
		this.richMediaPreview = richMediaPreview;
	};

	setVoiceTranscription = voiceTranscription => {
		this.voiceTranscription = voiceTranscription;
	};

	setMentions = mentions => {
		this.mentions = mentions;
	};

	setXssFilter = xssFilter => {
		this.xssFilter = xssFilter;
	};

	setProfanityFilter = profanityFilter => {
		this.profanityFilter = profanityFilter;
	};

	setImageModeration = imageModeration => {
		this.imageModeration = imageModeration;
	};

	setDataMasking = dataMasking => {
		this.dataMasking = dataMasking;
	};

	setMalwareScanner = malwareScanner => {
		this.malwareScanner = malwareScanner;
	};

	setSentimentAnalysis = sentimentAnalysis => {
		this.sentimentAnalysis = sentimentAnalysis;
	};

	setInflightMessageModeration = inflightMessageModeration => {
		this.inflightMessageModeration = inflightMessageModeration;
	};

	setMessageHistory = messageHistory => {
		this.messageHistory = messageHistory;
	};

	setViewProfile = viewProfile => {
		this.viewProfile = viewProfile;
	};

	setMessageInPrivate = messageInPrivate => {
		this.messageInPrivate = messageInPrivate;
	};

	setShowCallRecordingOption = showCallRecordingOption => {
		this.showCallRecordingOption = showCallRecordingOption;
	};

	setChatWindow = chatWindow => {
		this.chatWindow = chatWindow;
	};

	returnMatchedKey = (matchWith, optionToMatch) => {
		for (const [key, value] of Object.entries(matchWith)) {
			if (value === optionToMatch) {
				return key;
			}
		}

		return false;
	};
}
