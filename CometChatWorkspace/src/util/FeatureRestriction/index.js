import { CometChat } from "@cometchat-pro/chat";

export class FeatureRestriction {
	/**
	 * Core Chat
	 */
	static chat_users_list_enabled = "core.chat.users.list.enabled";
	static chat_users_presence_enabled = "core.chat.users.presence.enabled";
	static chat_users_search_enabled = "core.chat.users.search.enabled";

	static chat_groups_enabled = "core.chat.groups.enabled";
	static chat_groups_public_enabled = "core.chat.groups.public.enabled";
	static chat_groups_private_enabled = "core.chat.groups.private.enabled";
	static chat_groups_password_enabled = "core.chat.groups.password.enabled";
	static chat_groups_search_enabled = "core.chat.groups.search.enabled";

	static chat_messages_media_enabled = "core.chat.messages.media.enabled";
	static chat_messages_threads_enabled = "core.chat.messages.threads.enabled";
	static chat_messages_replies_enabled = "core.chat.messages.replies.enabled";
	static chat_messages_receipts_enabled = "core.chat.messages.receipts.enabled";
	static chat_messages_unread_count_enabled =
		"core.chat.messages.unread-count.enabled";
	static chat_messages_search_enabled = "core.chat.messages.search.enabled";
	static chat_messages_history_enabled = "core.chat.messages.history.enabled";
	static chat_messages_custom_enabled = "core.chat.messages.custom.enabled";

	static chat_one_on_one_enabled = "core.chat.one-on-one.enabled";
	static chat_voice_notes_enabled = "core.chat.voice-notes.enabled";
	static chat_typing_indicator_enabled = "core.chat.typing-indicator.enabled";

	/**
	 * Voice & Video Calling/Conferencing
	 */
	static calls_enabled = "core.call.enabled";
	static call_one_on_one_video_enabled = "core.call.one-on-one.video.enabled";
	static call_groups_video_enabled = "core.call.groups.video.enabled";
	static call_one_on_one_audio_enabled = "core.call.one-on-one.audio.enabled";
	static call_groups_audio_enabled = "core.call.groups.audio.enabled";
	static call_recording_enabled = "core.call.recording.enabled";
	static call_live_streaming_enabled = "core.call.live-streaming.enabled";
	static call_transcript_enabled = "core.call.transcript.enabled";

	/**
	 * Collaboration
	 */
	static collaboration_whiteboard_enabled =
		"features.collaboration.whiteboard.enabled";
	static collaboration_document_enabled =
		"features.collaboration.document.enabled";

	/**
	 * Moderation
	 */
	static moderation_groups_moderators_enabled =
		"features.moderation.groups.moderators.enabled";
	static moderation_users_block_enabled =
		"features.moderation.users.block.enabled";
	static moderation_groups_kick_enabled =
		"features.moderation.groups.kick.enabled";
	static moderation_groups_ban_enabled =
		"features.moderation.groups.ban.enabled";
	static moderation_xss_filter_enabled =
		"features.moderation.xss-filter.enabled";
	static moderation_profanity_filter_enabled =
		"features.moderation.profanity-filter.enabled";
	static moderation_image_moderation_enabled =
		"features.moderation.image-moderation.enabled";
	static moderation_data_masking_enabled =
		"features.moderation.data-masking.enabled";
	static moderation_malware_scanner_enabled =
		"features.moderation.malware-scanner.enabled";
	static moderation_sentiment_analysis_enabled =
		"features.moderation.sentiment-analysis.enabled";
	static moderation_inflight_message_moderation_enabled =
		"features.moderation.inflight-message-moderation.enabled";

	/**
	 * User Engagement
	 */
	static reactions_enabled = "features.ue.reactions.enabled";
	static emojis_enabled = "features.ue.emojis.enabled";
	static stickers_enabled = "features.ue.stickers.enabled";
	static message_translation_enabled =
		"features.ue.message-translation.enabled";
	static email_replies_enabled = "features.ue.email-replies.enabled";
	static polls_enabled = "features.ue.polls.enabled";
	static live_reactions_enabled = "features.ue.live-reactions.enabled";
	static smart_replies_enabled = "features.ue.smart-replies.enabled";
	static mentions_enabled = "features.ue.mentions.enabled";

	/**
	 * User Experience
	 */
	static thumbnail_generation_enabled =
		"features.ux.thumbnail-generation.enabled";
	static link_preview_enabled = "features.ux.link-preview.enabled";
	static messages_saved_enabled = "features.ux.messages.saved.enabled";
	static messages_pinned_enabled = "features.ux.messages.pinned.enabled";
	static rich_media_preview_enabled = "features.ux.rich-media-preview.enabled";
	static voice_transcription_enabled =
		"features.ux.voice-transcription.enabled";

	/**
	 * Extensions slug
	 */
	static dataMasking = "data-masking";
	static profanityFilter = "profanity-filter";
	static thumbnailGeneration = "thumbnail-generator";
	static linkPreview = "link-preview";
	static richMediaPreview = "rich-media";
	static sticker = "stickers";
	static reactions = "reactions";
	static messageTranslation = "message-translation";
	static smartReplies = "smart-reply";
	static collaborationWhiteboard = "whiteboard";
	static collaborationDocument = "document";
	static pinMessages = "pin-message";
	static saveMessages = "save-message";
	static voiceTranscription = "voice-transcription";
	static polls = "polls";
	static xssFilter = "xss-filter";
	static imageModeration = "image-moderation";
	static malwareScanner = "virus-malware-scanner";
	static sentimentAnalysis = "sentiment-analysis";
	static emailReplies = "email-replies";
	static emojis = "emojis";
	static mentions = "mentions";

	static isExtensionEnabled = (extensionKey) => {
		return new Promise((resolve) =>
			CometChat.isExtensionEnabled(extensionKey)
				.then((response) => resolve(response))
				.catch((error) => resolve(false))
		);
	};

	UIKitSettings;

	constructor(UIKitSettings) {
		this.UIKitSettings = UIKitSettings;
	}

	isRecentChatListEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.chats));
	isGroupListEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.groups));
	isUserSettingsEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.userSettings));
	isEditMessageEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.editMessage));
	isQNAModeEnabled = () =>
		new Promise((resolve) =>
			resolve(this.UIKitSettings.setGroupInQnaModeByModerators)
		);
	isHighlightMessagesEnabled = () =>
		new Promise((resolve) =>
			resolve(this.UIKitSettings.highlightMessageFromModerators)
		);
	isJoinLeaveGroupsEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.joinOrLeaveGroup));
	isLargerSizeEmojisEnabled = () =>
		new Promise((resolve) =>
			resolve(this.UIKitSettings.sendEmojisInLargerSize)
		);
	isGifsEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.sendGifs));
	isShareCopyForwardMessageEnabled = () =>
		new Promise((resolve) =>
			resolve(this.UIKitSettings.shareCopyForwardMessage)
		);
	isSharedMediaEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.viewShareMedia));
	isMessagesSoundEnabled = () =>
		new Promise((resolve) =>
			resolve(this.UIKitSettings.enableSoundForMessages)
		);
	isCallsSoundEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.enableSoundForCalls));
	isViewingGroupMembersEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.viewGroupMembers));
	isCallActionMessagesEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.callNotifications));
	isGroupDeletionEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.allowDeleteGroup));
	isChangingGroupMemberScopeEnabled = () =>
		new Promise((resolve) =>
			resolve(this.UIKitSettings.allowPromoteDemoteMembers)
		);
	isAddingGroupMembersEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.allowAddMembers));
	isLocationSharingEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.shareLocation));
	isGroupActionMessagesEnabled = () =>
		new Promise((resolve) =>
			resolve(this.UIKitSettings.joinLeaveNotifications)
		);
	isGroupCreationEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.groupCreation));
	isDeleteMessageEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.deleteMessage));
	isHideDeletedMessagesEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.hideDeletedMessages));
	isViewProfileEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.viewProfile));
	isMessageInPrivateEnabled = () =>
		new Promise((resolve) => resolve(this.UIKitSettings.messageInPrivate));

	isCallListEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.calls_enabled)
				.then((response) => resolve(response && this.UIKitSettings.calls))
				.catch((error) => resolve(false));
		});
	};

	isUserListEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.chat_users_list_enabled)
				.then((response) => resolve(response && this.UIKitSettings.users))
				.catch((error) => resolve(false));
		});
	};

	isOneOnOneVideoCallEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.call_one_on_one_video_enabled
			)
				.then((response) =>
					resolve(response && this.UIKitSettings.userVideoCall)
				)
				.catch((error) => resolve(false));
		});
	};

	isGroupVideoCallEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.call_groups_video_enabled)
				.then((response) =>
					resolve(response && this.UIKitSettings.groupVideoCall)
				)
				.catch((error) => resolve(false));
		});
	};

	isOneOnOneAudioCallEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.call_one_on_one_audio_enabled
			)
				.then((response) =>
					resolve(response && this.UIKitSettings.userAudioCall)
				)
				.catch((error) => resolve(false));
		});
	};

	isGroupAudioCallEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.call_groups_audio_enabled)
				.then((response) =>
					resolve(response && this.UIKitSettings.groupAudioCall)
				)
				.catch((error) => resolve(false));
		});
	};

	isOneOnOneChatEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.chat_one_on_one_enabled)
				.then((response) =>
					resolve(response && this.UIKitSettings.sendMessageInOneOnOne)
				)
				.catch((error) => resolve(false));
		});
	};

	isGroupChatEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.chat_groups_enabled)
				.then((response) =>
					resolve(response && this.UIKitSettings.sendMessageInGroup)
				)
				.catch((error) => resolve(false));
		});
	};

	isDeleteMemberMessageEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.moderation_groups_moderators_enabled
			)
				.then((response) =>
					resolve(
						response && this.UIKitSettings.allowModeratorToDeleteMemberMessages
					)
				)
				.catch((error) => resolve(false));
		});
	};

	isBlockUserEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.moderation_users_block_enabled
			)
				.then((response) => resolve(response && this.UIKitSettings.blockUser))
				.catch((error) => resolve(false));
		});
	};

	isEmojisEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.emojis_enabled)
				.then((response) => resolve(response && this.UIKitSettings.sendEmojis))
				.catch((error) => resolve(false));
		});
	};

	isFilesEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.chat_messages_media_enabled)
				.then((response) => resolve(response && this.UIKitSettings.sendFiles))
				.catch((error) => resolve(false));
		});
	};

	isPhotosVideosEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.chat_messages_media_enabled)
				.then((response) =>
					resolve(response && this.UIKitSettings.sendPhotoVideos)
				)
				.catch((error) => resolve(false));
		});
	};

	isKickingGroupMembersEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.moderation_groups_kick_enabled
			)
				.then((response) => resolve(response && this.UIKitSettings.kickMember))
				.catch((error) => resolve(false));
		});
	};

	isBanningGroupMembersEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.moderation_groups_ban_enabled
			)
				.then((response) => resolve(response && this.UIKitSettings.banMember))
				.catch((error) => resolve(false));
		});
	};

	isVoiceNotesEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.chat_voice_notes_enabled)
				.then((response) =>
					resolve(response && this.UIKitSettings.sendVoiceNotes)
				)
				.catch((error) => resolve(false));
		});
	};

	isTypingIndicatorsEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.chat_typing_indicator_enabled
			)
				.then((response) =>
					resolve(response && this.UIKitSettings.sendTypingIndicator)
				)
				.catch((error) => resolve(false));
		});
	};

	isUserPresenceEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.chat_users_presence_enabled)
				.then((response) =>
					resolve(response && this.UIKitSettings.showUserPresence)
				)
				.catch((error) => resolve(false));
		});
	};

	isThreadedMessagesEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.chat_messages_threads_enabled
			)
				.then((response) =>
					resolve(response && this.UIKitSettings.threadedChats)
				)
				.catch((error) => resolve(false));
		});
	};

	isMessageRepliesEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.chat_messages_replies_enabled
			)
				.then((response) =>
					resolve(response && this.UIKitSettings.replyingToMessage)
				)
				.catch((error) => resolve(false));
		});
	};

	isDeliveryReceiptsEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.chat_messages_receipts_enabled
			)
				.then((response) =>
					resolve(response && this.UIKitSettings.showReadDeliveryReceipts)
				)
				.catch((error) => resolve(false));
		});
	};

	isLiveReactionsEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.live_reactions_enabled)
				.then((response) =>
					resolve(response && this.UIKitSettings.sendLiveReaction)
				)
				.catch((error) => resolve(false));
		});
	};

	isPublicGroupEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.chat_groups_public_enabled)
				.then((response) => resolve(response && this.UIKitSettings.publicGroup))
				.catch((error) => resolve(false));
		});
	};

	isPrivateGroupEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.chat_groups_private_enabled)
				.then((response) =>
					resolve(response && this.UIKitSettings.privateGroup)
				)
				.catch((error) => resolve(false));
		});
	};

	isPasswordGroupEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.chat_groups_password_enabled
			)
				.then((response) =>
					resolve(response && this.UIKitSettings.passwordGroup)
				)
				.catch((error) => resolve(false));
		});
	};

	isUnreadCountEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.chat_messages_unread_count_enabled
			)
				.then((response) => resolve(response && this.UIKitSettings.unreadCount))
				.catch((error) => resolve(false));
		});
	};

	isUserSearchEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.chat_users_search_enabled)
				.then((response) => resolve(response && this.UIKitSettings.searchUsers))
				.catch((error) => resolve(false));
		});
	};

	isGroupSearchEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.chat_groups_search_enabled)
				.then((response) =>
					resolve(response && this.UIKitSettings.searchGroups)
				)
				.catch((error) => resolve(false));
		});
	};

	isMessageSearchEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.chat_messages_search_enabled
			)
				.then((response) =>
					resolve(response && this.UIKitSettings.searchMessages)
				)
				.catch((error) => resolve(false));
		});
	};

	isCallRecordingEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.call_recording_enabled)
				.then((response) =>
					resolve(response && this.UIKitSettings.callRecording)
				)
				.catch((error) => resolve(false));
		});
	};

	isCallLiveStreamingEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.call_live_streaming_enabled)
				.then((response) =>
					resolve(response && this.UIKitSettings.callLiveStreaming)
				)
				.catch((error) => resolve(false));
		});
	};

	isCallTranscriptEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.call_transcript_enabled)
				.then((response) =>
					resolve(response && this.UIKitSettings.callTranscription)
				)
				.catch((error) => resolve(false));
		});
	};

	isMessageHistoryEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.chat_messages_history_enabled
			)
				.then((response) =>
					resolve(response && this.UIKitSettings.messageHistory)
				)
				.catch((error) => resolve(false));
		});
	};

	isMessageTranslationEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.message_translation_enabled)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.messageTranslation
						)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.messageTranslation)
				)
				.catch((error) => resolve(false));
		});
	};

	isReactionsEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.reactions_enabled)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(FeatureRestriction.reactions)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.sendMessageReaction)
				)
				.catch((error) => resolve(false));
		});
	};

	isCollaborativeWhiteBoardEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.collaboration_whiteboard_enabled
			)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.collaborationWhiteboard
						)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.collaborativeWhiteboard)
				)
				.catch((error) => resolve(false));
		});
	};

	isCollaborativeDocumentEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.collaboration_document_enabled
			)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.collaborationDocument
						)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.collaborativeDocument)
				)
				.catch((error) => resolve(false));
		});
	};

	isStickersEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.stickers_enabled)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(FeatureRestriction.sticker)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.sendStickers)
				)
				.catch((error) => resolve(false));
		});
	};

	isEmailRepliesEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.email_replies_enabled)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.emailReplies
						)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.emailReplies)
				)
				.catch((error) => resolve(false));
		});
	};

	isPollsEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.polls_enabled)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(FeatureRestriction.polls)
				)
				.then((response) => resolve(response && this.UIKitSettings.polls))
				.catch((error) => resolve(false));
		});
	};

	isSmartRepliesEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.smart_replies_enabled)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.smartReplies
						)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.smartReplies)
				)
				.catch((error) => resolve(false));
		});
	};

	isThumbnailGenerationEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.thumbnail_generation_enabled
			)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.thumbnailGeneration
						)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.thumbnailGeneration)
				)
				.catch((error) => resolve(false));
		});
	};

	isLinkPreviewEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.link_preview_enabled)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.linkPreview
						)
				)
				.then((response) => resolve(response && this.UIKitSettings.linkPreview))
				.catch((error) => resolve(false));
		});
	};

	isSaveMessagesEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.messages_saved_enabled)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.saveMessages
						)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.saveMessages)
				)
				.catch((error) => resolve(false));
		});
	};

	isPinMessagesEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.messages_pinned_enabled)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.pinMessages
						)
				)
				.then((response) => resolve(response && this.UIKitSettings.pinMessages))
				.catch((error) => resolve(false));
		});
	};

	isRichMediaPreviewEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.rich_media_preview_enabled)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.richMediaPreview
						)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.richMediaPreview)
				)
				.catch((error) => resolve(false));
		});
	};

	isVoiceTranscriptionEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.voice_transcription_enabled)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.voiceTranscription
						)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.voiceTranscription)
				)
				.catch((error) => resolve(false));
		});
	};

	isMentionsEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(FeatureRestriction.mentions_enabled)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(FeatureRestriction.mentions)
				)
				.then((response) => resolve(response && this.UIKitSettings.mentions))
				.catch((error) => resolve(false));
		});
	};

	isXssFilterEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.moderation_xss_filter_enabled
			)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(FeatureRestriction.xssFilter)
				)
				.then((response) => resolve(response && this.UIKitSettings.xssFilter))
				.catch((error) => resolve(false));
		});
	};

	isProfanityFilterEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.moderation_profanity_filter_enabled
			)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.profanityFilter
						)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.profanityFilter)
				)
				.catch((error) => resolve(false));
		});
	};

	isImageModerationEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.moderation_image_moderation_enabled
			)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.imageModeration
						)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.imageModeration)
				)
				.catch((error) => resolve(false));
		});
	};

	isDataMaskingEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.moderation_data_masking_enabled
			)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.dataMasking
						)
				)
				.then((response) => resolve(response && this.UIKitSettings.dataMasking))
				.catch((error) => resolve(false));
		});
	};

	isMalwareScannerEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.moderation_malware_scanner_enabled
			)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.malwareScanner
						)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.malwareScanner)
				)
				.catch((error) => resolve(false));
		});
	};

	isSentimentAnalysisEnabled = () => {
		return new Promise((resolve) => {
			CometChat.isFeatureEnabled(
				FeatureRestriction.moderation_sentiment_analysis_enabled
			)
				.then(
					(response) =>
						response &&
						FeatureRestriction.isExtensionEnabled(
							FeatureRestriction.sentimentAnalysis
						)
				)
				.then((response) =>
					resolve(response && this.UIKitSettings.sentimentAnalysis)
				)
				.catch((error) => resolve(false));
		});
	};

	// isInFlightMessageModerationEnabled = () => {

	//     return new Promise(resolve => {

	//         CometChat.isFeatureEnabled(FeatureRestriction.moderation_inflight_message_moderation_enabled)
	//             .then(response => {

	//                 return response
	//                     && FeatureRestriction.isExtensionEnabled(FeatureRestriction.sentimentAnalysis)
	//                     && this.UIKitSettings.inflightMessageModeration;
	//             })
	//             .catch(error => resolve(false));
	//     });
	// }
}
