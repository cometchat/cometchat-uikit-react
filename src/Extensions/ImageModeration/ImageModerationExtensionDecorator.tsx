import React from "react";
import { createComponent } from "@lit-labs/react";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatTheme, CometChatUIEvents, fontHelper, localize } from "uikit-resources-lerna";
import { MessageBubbleAlignment, ImageModeration } from "uikit-utils-lerna";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ImageModerationConfiguration } from "./ImageModerationConfiguration";
import { BaseStyle, CometChatBackdrop, CometChatConfirmDialog } from "my-cstom-package-lit";
import PlaceholderImage from './assets/placeholder.png';
import { CometChatImageBubble, FullScreenViewer } from 'my-cstom-package-lit';
import Close2xIcon from './assets/close2x.svg';

const CometChatImageModerationBubble = createComponent({
    tagName: 'image-moderation',
    elementClass: ImageModeration,
    react: React,
    events: {
        CCShowDialog: 'cc-show-dialog'
    }
});

const CometChatBackDropElement = createComponent({
    tagName: 'cometchat-backdrop',
    elementClass: CometChatBackdrop,
    react: React
});

const CometChatConfirmDialogBox = createComponent({
    tagName: 'cometchat-confirm-dialog',
    elementClass: CometChatConfirmDialog,
    react: React,
    events: {
        ccCancelClicked: 'cc-cancel-clicked',
        ccConfirmClicked: 'cc-confirm-clicked'
    }
});

const ImageMessageBubble = createComponent({
    tagName: 'cometchat-image-bubble',
    elementClass: CometChatImageBubble,
    react: React,
    events: {
        'ccImageClicked': 'cc-image-clicked'
    }
});

const FullScreenImageViewer = createComponent({
    tagName: 'full-screen-viewer',
    elementClass: FullScreenViewer,
    react: React,
    events: {
        'ccCloseClicked': 'cc-close-clicked'
    }
});

export class ImageModerationExtensionDecorator extends DataSourceDecorator {
    public configuration?: ImageModerationConfiguration;
    public newDataSource!: DataSource;
    private theme!: CometChatTheme;

    constructor(dataSource: DataSource, {configuration}: {configuration: ImageModerationConfiguration}) {
        super(dataSource);
        this.newDataSource = dataSource;
        this.configuration = configuration!;
    }

    override getId(): string {
        return "imagemoderation";
    }

    override getImageMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme) {
        this.theme = theme;
        let metadata = message.getMetadata() as any;
        const style = this.getImageModerationStyle(theme);
        let imageUrl = message.getAttachments()[0].getUrl();
        if(ChatConfigurator.names.includes("thumbnailgeneration") && metadata && typeof metadata === "object" && metadata.hasOwnProperty("@injected") && metadata["@injected"].hasOwnProperty("extensions") && metadata["@injected"]["extensions"].hasOwnProperty("thumbnail-generation") && metadata["@injected"]["extensions"]["thumbnail-generation"]["url_small"]){
            imageUrl = (message.getMetadata() as any)["@injected"]["extensions"]["thumbnail-generation"]["url_small"];
        }

        const fullScreenViewer = <FullScreenImageViewer URL={message?.getAttachments()[0]?.getUrl() ?? imageUrl} closeIconURL={Close2xIcon} fullScreenViewerStyle={{closeIconTint:"blue"}} ccCloseClicked={()=>{CometChatUIEvents.ccHideDialog.next()}} />
        return (
            <CometChatImageModerationBubble
                message={message}
                imageModerationStyle={style}
                CCShowDialog={(e)=>{this.showDialog(e)}}
            >
                <ImageMessageBubble src={imageUrl} placeholderImage={PlaceholderImage} ccImageClicked={()=>{CometChatUIEvents.ccShowDialog.next({child: fullScreenViewer, confirmCallback: null})}} />
            </CometChatImageModerationBubble>
        );
    }

    showDialog(_event: any){
        const confirmModal = this.getConfirmationModal(_event);

        CometChatUIEvents.ccShowDialog.next({
            confirmCallback: _event?.detail?.onConfirm,
            child: confirmModal
        });
    }

    getConfirmationModal(_event: any){
        let configurationBackdropStyle = this.configuration?.getBackDropStyle();
        let configurationConfirmDialogStyle = this.configuration?.getConfirmDialogSyle();
        let backdropStyle: BaseStyle = {
                height: configurationBackdropStyle?.height || "100%",
                width: configurationBackdropStyle?.width || "100%",
                background: configurationBackdropStyle?.background || "rgba(0, 0, 0, 0.5)",
                border: configurationBackdropStyle?.border,
                borderRadius: configurationBackdropStyle?.borderRadius
            },
            warningText: string = localize("SHOW_UNSAFE_CONTENT"),
            confirmText: string = localize("YES"),
            cancelText: string = localize("NO"),
            confirmDialogStyle = {
                confirmButtonBackground: configurationConfirmDialogStyle?.confirmButtonBackground || this.theme.palette.getError(),
                cancelButtonBackground: configurationConfirmDialogStyle?.cancelButtonBackground || this.theme.palette.getSecondary(),
                confirmButtonTextColor: configurationConfirmDialogStyle?.confirmButtonTextColor || this.theme.palette.getAccent900("light"),
                confirmButtonTextFont: configurationConfirmDialogStyle?.confirmButtonTextFont || fontHelper(this.theme.typography.text2),
                cancelButtonTextColor: configurationConfirmDialogStyle?.cancelButtonTextColor || this.theme.palette.getAccent900("dark"),
                cancelButtonTextFont: configurationConfirmDialogStyle?.cancelButtonTextFont || fontHelper(this.theme.typography.text2),
                titleFont: configurationConfirmDialogStyle?.titleFont || fontHelper(this.theme.typography.title1),
                titleColor: configurationConfirmDialogStyle?.titleColor || this.theme.palette.getAccent(),
                messageTextFont: configurationConfirmDialogStyle?.messageTextFont || fontHelper(this.theme.typography.subtitle2),
                messageTextColor: configurationConfirmDialogStyle?.messageTextColor || this.theme.palette.getAccent600(),
                background: configurationConfirmDialogStyle?.background || this.theme.palette.getBackground(),
                height: configurationConfirmDialogStyle?.height || "100%",
                width: configurationConfirmDialogStyle?.width || "100%",
                border: configurationConfirmDialogStyle?.border || `1px solid ${this.theme.palette.getAccent100()}`,
                borderRadius: configurationConfirmDialogStyle?.borderRadius || "8px"
            };
        return (
            <CometChatBackDropElement backdropStyle={backdropStyle}>
                <CometChatConfirmDialogBox
                    title=""
                    messageText={warningText}
                    cancelButtonText={cancelText}
                    confirmButtonText={confirmText}
                    confirmDialogStyle={confirmDialogStyle}
                    ccCancelClicked={this.onCancelClicked}
                    ccConfirmClicked={()=>{this.onConfirmClicked(_event)}}
                />
            </CometChatBackDropElement>
        )
    }

    onConfirmClicked(_event: any){
        if(_event?.detail?.onConfirm){
            _event?.detail?.onConfirm();
        }
        CometChatUIEvents.ccHideDialog.next();
    }

    onCancelClicked(){
        CometChatUIEvents.ccHideDialog.next();
    }

    getImageModerationStyle(_theme: CometChatTheme){
        let configurationImageModerationBubbleStyle = this.configuration?.getImageModerationStyle();
        return {
            filterColor: configurationImageModerationBubbleStyle?.filterColor || _theme.palette.getPrimary(),
            height: configurationImageModerationBubbleStyle?.height || "100%",
            width: configurationImageModerationBubbleStyle?.width || "100%",
            border: configurationImageModerationBubbleStyle?.border || "none",
            warningTextColor: configurationImageModerationBubbleStyle?.warningTextColor || _theme.palette.getAccent("dark"),
            warningTextFont: configurationImageModerationBubbleStyle?.warningTextFont || fontHelper(_theme.typography.title2)
        }
    }
}