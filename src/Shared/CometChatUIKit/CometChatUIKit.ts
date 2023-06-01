import { CometChat } from "@cometchat-pro/chat";
import { ChatConfigurator } from "../Framework/ChatConfigurator";
import { CometChatMessageEvents, MessageStatus } from "uikit-resources-lerna";
import { UIKitSettings } from 'uikit-utils-lerna';
import { ExtensionsDataSource } from "../Framework/ExtensionsDataSource";
import { CallingExtension } from "../../Calling/CallingExtension";
import { CollaborativeDocumentExtension } from "../../Extensions/CollaborativeDocument/CollaborativeDocumentExtension";
import { CollaborativeWhiteBoardExtension } from "../../Extensions/CollaborativeWhiteboard/CollaborativeWhiteboardExtension";
import { ImageModerationExtension } from "../../Extensions/ImageModeration/ImageModerationExtension";
import { LinkPreviewExtension } from "../../Extensions/LinkPreview/LinkPreviewExtension";
import { MessageTranslationExtension } from "../../Extensions/MessageTranslation/MessageTranslationExtension";
import { PollsExtension } from "../../Extensions/Polls/PollsExtension";
import { ReactionExtension } from "../../Extensions/Reactions/ReactionExtension";
import { SmartReplyExtension } from "../../Extensions/SmartReplies/SmartRepliesExtension";
import { StickersExtension } from "../../Extensions/Stickers/StickersExtension";
import { TextModeratorExtension } from "../../Extensions/TextModerator/TextModeratorExtension";
import { ThumbnailGenerationExtension } from "../../Extensions/ThumbnailGeneration/ThumbnailGenerationExtension";

export class CometChatUIKit {
    static uiKitSettings: UIKitSettings | null;

    static init(uiKitSettings: UIKitSettings | null): Promise<Object> | undefined {
        CometChatUIKit.uiKitSettings = uiKitSettings
        if (!CometChatUIKit.checkAuthSettings()) return undefined;
        const appSettingsBuilder = new CometChat.AppSettingsBuilder();
        if (uiKitSettings!.getRoles()) {
            appSettingsBuilder.subscribePresenceForRoles(uiKitSettings!.getRoles());
        } else if (uiKitSettings!.getSubscriptionType() === "ALL_USERS") {
            appSettingsBuilder.subscribePresenceForAllUsers();
        } else if (uiKitSettings!.getSubscriptionType() === "FRIENDS") {
            appSettingsBuilder.subscribePresenceForFriends();
        }
        appSettingsBuilder.autoEstablishSocketConnection(uiKitSettings!.isAutoEstablishSocketConnection());
        appSettingsBuilder.setRegion(uiKitSettings!.getRegion());
        const appSettings = appSettingsBuilder.build();
        return new Promise((resolve, reject) => {
            CometChat.init(uiKitSettings?.appId, appSettings).then(() => {
                CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
                    if (user) {
                        ChatConfigurator.init();
                        this.initiateAfterLogin()

                    }
                    return resolve(user!)
                }).catch((error: CometChat.CometChatException) => {
                    console.log(error)
                    return reject(error)
                })
            })
                .catch((error: CometChat.CometChatException) => {
                    return reject(error)
                })
        });
    }

    static defaultExtensions: ExtensionsDataSource[] = [
        new StickersExtension(),
        new SmartReplyExtension(),
        new CollaborativeWhiteBoardExtension(),
        new CollaborativeDocumentExtension(),
        new MessageTranslationExtension(),
        new TextModeratorExtension(),
        new ThumbnailGenerationExtension(),
        new LinkPreviewExtension(),
        new PollsExtension(),
        new ReactionExtension(),
        new ImageModerationExtension()
    ]

    static enableCalling() {
        try {
            if (window) {
                if ((window as any).isCallingEnabled) {
                    new CallingExtension().enable();
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    private static initiateAfterLogin() {
        if (CometChatUIKit.uiKitSettings != null) {
            let extensionList: ExtensionsDataSource[] = CometChatUIKit.uiKitSettings.getExtensions()?.length > 0 ? CometChatUIKit.uiKitSettings.getExtensions() : this.defaultExtensions;
            this.enableCalling();
            if (extensionList?.length > 0) {
                (extensionList as ExtensionsDataSource[]).forEach((extension: ExtensionsDataSource) => {
                    extension?.enable()
                })
            }
        }
    }

    static login(uid: string): Promise<CometChat.User> | undefined {
        if (!CometChatUIKit.checkAuthSettings()) return undefined;
        return new Promise((resolve, reject) => {
            CometChat.login(uid, CometChatUIKit.uiKitSettings!.authKey!).then((user: CometChat.User) => {
                resolve(user);
                ChatConfigurator.init();
                this.initiateAfterLogin();
            }).catch((error: CometChat.CometChatException) => {
                reject(error)
            })
        });
    }

    static loginWithAuthToken(authToken: string): Promise<CometChat.User> | undefined {
        if (!CometChatUIKit.checkAuthSettings()) return undefined;
        return new Promise((resolve, reject) => {
            CometChat.login(authToken).then((user: CometChat.User) => {
                resolve(user)
                ChatConfigurator.init();
                this.initiateAfterLogin();
            }).catch((error: CometChat.CometChatException) => {
                reject(error)
            })
        });
    }

    static getLoggedinUser(): Promise<CometChat.User | null> | undefined {
        if (!CometChatUIKit.checkAuthSettings()) return undefined;
        return new Promise((resolve, reject) => {
            CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
                resolve(user);
            }).catch((error: CometChat.CometChatException) => {
                reject(error);
            })
        })
    }

    static createUser(user: CometChat.User): Promise<CometChat.User> | undefined {
        if (!CometChatUIKit.checkAuthSettings()) return undefined;
        return new Promise((resolve, reject) => {
            CometChat.createUser(user, CometChatUIKit.uiKitSettings!.authKey!).then((user: CometChat.User) => {
                resolve(user)
            }).catch((error: CometChat.CometChatException) => {
                reject(error)
            })
        });
    }

    static updateUser(user: CometChat.User): Promise<CometChat.User> | undefined {
        if (!CometChatUIKit.checkAuthSettings()) return undefined;
        return new Promise((resolve, reject) => {
            CometChat.updateUser(user, CometChatUIKit.uiKitSettings!.authKey!).then((user: CometChat.User) => {
                resolve(user)
            }).catch((error: CometChat.CometChatException) => {
                reject(error)
            })
        });
    }

    static logout(): Promise<Object> | undefined {
        if (!CometChatUIKit.checkAuthSettings()) return undefined;
        return new Promise((resolve, reject) => {
            CometChat.logout().then((message: object) => {
                resolve(message)
            }).catch((error: CometChat.CometChatException) => {
                reject(error)
            })
        });
    }

    static checkAuthSettings(): boolean {
        if (CometChatUIKit.uiKitSettings == null) {
            return false;
        }

        if (CometChatUIKit.uiKitSettings!.appId == null) {
            return false;
        }

        return true;
    }

    static sendCustomMessage(message: CometChat.CustomMessage) {
        CometChatMessageEvents.ccMessageSent.next({ message: message, status: MessageStatus.inprogress });

        CometChat.sendCustomMessage(message).then((message: CometChat.BaseMessage) => {
            CometChatMessageEvents.ccMessageSent.next({ message: message, status: MessageStatus.success });
        }).catch((error: CometChat.CometChatException) => {
            message.setMetadata({ error })
            CometChatMessageEvents.ccMessageSent.next({ message: message, status: MessageStatus.error });
        })
    }

    static sendTextMessage(message: CometChat.TextMessage) {
        CometChatMessageEvents.ccMessageSent.next({ message: message, status: MessageStatus.inprogress });

        CometChat.sendMessage(message).then((message: CometChat.BaseMessage) => {
            CometChatMessageEvents.ccMessageSent.next({ message: message, status: MessageStatus.success });
        }).catch((error: CometChat.CometChatException) => {
            message.setMetadata({ error })
            CometChatMessageEvents.ccMessageSent.next({ message: message, status: MessageStatus.error });
        })
    }

    static sendMediaMessage(message: CometChat.MediaMessage) {
        CometChatMessageEvents.ccMessageSent.next({ message: message, status: MessageStatus.inprogress });

        CometChat.sendMediaMessage(message).then((message: CometChat.BaseMessage) => {
            CometChatMessageEvents.ccMessageSent.next({ message: message, status: MessageStatus.success });
        }).catch((error: CometChat.CometChatException) => {
            message.setMetadata({ error })
            CometChatMessageEvents.ccMessageSent.next({ message: message, status: MessageStatus.error });
        })
    }

}