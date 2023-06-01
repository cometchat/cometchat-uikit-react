import { ActionSheetStyle, EmojiKeyboardStyle, MessageInputStyle, PopoverStyle, PreviewStyle } from "my-cstom-package-lit";
import { CSSProperties } from "react";
import { CreatePollStyle, MessageComposerStyle } from "uikit-utils-lerna";
import { CometChatTheme, fontHelper } from "uikit-resources-lerna";

export const LIVE_REACTION_ICON_TINT = "red";
const RIGHT_MOST_BUTTON_HORIZONTAL_MARGIN = "10px";

export function previewStyle(messageComposerStyle : MessageComposerStyle | undefined, theme : CometChatTheme) : PreviewStyle {
    return new PreviewStyle({
        height: "100%",
        width: "100%",
        border: `1px solid ${theme.palette.getAccent200()}`,
        background: theme.palette.getBackground(),
        previewTitleFont: messageComposerStyle?.previewTitleFont || fontHelper(theme.typography.caption1),
        previewTitleColor: messageComposerStyle?.previewTitleColor || theme.palette.getAccent600(),
        previewSubtitleFont: messageComposerStyle?.previewSubtitleFont || fontHelper(theme.typography.subtitle2),
        previewSubtitleColor: messageComposerStyle?.previewSubtitleColor || theme.palette.getAccent400(),
        closeButtonIconTint: messageComposerStyle?.closePreviewTint || theme.palette.getAccent600()
    });
}

export function messageInputStyle(messageComposerStyle : MessageComposerStyle | undefined, theme : CometChatTheme) : MessageInputStyle {
    return new MessageInputStyle({
        height: "100%",
        width: "100%",
        maxHeight: messageComposerStyle?.maxInputHeight || "50%",
        border: "none",
        borderRadius: "inherit",
        background: "inherit",
        textFont: messageComposerStyle?.textFont || fontHelper(theme.typography.text2),
        textColor: messageComposerStyle?.textColor || theme.palette.getAccent(),
        dividerColor: messageComposerStyle?.dividerTint || theme.palette.getAccent100(),
        inputBorder: messageComposerStyle?.inputBorder || "none",
        inputBorderRadius: "inherit",
        inputBackground: messageComposerStyle?.inputBackground || "transparent"
    });
}

export function liveReactionButtonStyle() {
    return {
        height: "24px",
        width: "24px",
        border: "none",
        borderRadius: "0",
        buttonIconTint: LIVE_REACTION_ICON_TINT,
        background: "transparent"
    };
}

export function sendButtonStyle(messageComposerStyle : MessageComposerStyle | undefined, theme : CometChatTheme) {
    return {
        height: "24px",
        width: "24px",
        border: "none",
        borderRadius: "0",
        buttonIconTint: messageComposerStyle?.sendIconTint || theme.palette.getPrimary(),
        background: "transparent"
    };
}

function getEmojiButtonIconTint(messageComposerStyle : MessageComposerStyle | undefined, theme : CometChatTheme, isAuxiliaryContentDisplayed : boolean) : string | undefined {
    if (isAuxiliaryContentDisplayed) {
        return theme.palette.getAccent();
    }

    return messageComposerStyle?.emojiIconTint || theme.palette.getAccent500();
}

function getAttachButtonIconTint(messageComposerStyle : MessageComposerStyle | undefined, theme : CometChatTheme, isSecondaryContentDisplayed : boolean) : string | undefined {
    if (isSecondaryContentDisplayed) {
        return theme.palette.getAccent();
    }

    return messageComposerStyle?.attachIcontint || theme.palette.getAccent600();
}

export function sendButtonDivStyle() : CSSProperties {
    return {
        margin: `0px ${RIGHT_MOST_BUTTON_HORIZONTAL_MARGIN}`
    };
}

export function liveReactionButtonDivStyle() : CSSProperties {
    return {
        margin: `0px ${RIGHT_MOST_BUTTON_HORIZONTAL_MARGIN}`
    };
}

export function fileMediaPickerStyle() : CSSProperties {
    return {
        display: "none"
    };
}

export function messageComposerStyle(messageComposerStyleObject : MessageComposerStyle | undefined, theme : CometChatTheme) : CSSProperties {
    return {
        width: messageComposerStyleObject?.width || "100%",
        height: messageComposerStyleObject?.height || "100%",
        boxSizing: "border-box",
        border: messageComposerStyleObject?.border || `1px solid ${theme.palette.getAccent100()}`,
        borderRadius: messageComposerStyleObject?.borderRadius || "12px",
        background: messageComposerStyleObject?.background || theme.palette.getAccent50()
    };
}

export function auxiliaryViewStyle() : CSSProperties {
    return {
        display: "flex",
        columnGap: "16px"
    };
}

export function createPollStyle(theme : CometChatTheme) : CreatePollStyle {
    return new CreatePollStyle({
        placeholderTextFont: fontHelper(theme.typography.subtitle1),
        placeholderTextColor: theme.palette.getAccent600(),
        deleteIconTint: theme.palette.getAccent600(),
        titleFont: fontHelper(theme.typography.title1),
        titleColor: theme.palette.getAccent(),
        closeIconTint: theme.palette.getPrimary(),
        questionInputBackground: theme.palette.getAccent100(),
        optionInputBackground: theme.palette.getAccent100(),
        answerHelpTextFont: fontHelper(theme.typography.caption1),
        answerHelpTextColor: theme.palette.getAccent400(),
        addAnswerIconTint: theme.palette.getPrimary(),
        createPollButtonTextFont: fontHelper(theme.typography.text2),
        createPollButtonTextColor: theme.palette.getAccent("dark"),
        createPollButtonBackground: theme.palette.getPrimary(),
        addAnswerTextFont: fontHelper(theme.typography.text2),
        addAnswerTextColor: theme.palette.getPrimary(),
        errorTextFont: fontHelper(theme.typography.subtitle1),
        errorTextColor: theme.palette.getError(),
        optionPlaceholderTextFont: fontHelper(theme.typography.subtitle1),
        optionPlaceholderTextColor: theme.palette.getAccent600(),
        questionInputTextFont: fontHelper(theme.typography.subtitle2),
        questionInputTextColor: theme.palette.getAccent600(),
        optionInputTextFont: fontHelper(theme.typography.subtitle2),
        optionInputTextColor: theme.palette.getAccent600(),
        width: "360px",
        height: "440px",
        border: "",
        borderRadius: "8px",
        background: theme.palette.getAccent900()
    });
}

// Default secondary view related styles

const ACTION_SHEET_HEIGHT = "244px";
const ACTION_SHEET_WIDTH = "272px";
const ACTION_SHEET_BORDER_RADIUS = "12px";

export function attachmentPopoverStyle(theme : CometChatTheme) : PopoverStyle {
    return new PopoverStyle({
        width: ACTION_SHEET_WIDTH,
        height: ACTION_SHEET_HEIGHT,
        borderRadius: ACTION_SHEET_BORDER_RADIUS,
        boxShadow: "0px 0px 0px 1px rgba(20, 20, 20, 0.04), 0px 16px 32px 0px rgba(20, 20, 20, 0.2)"
    });
}

export function actionSheetContainerStyle(theme : CometChatTheme) : CSSProperties {
    return {
        width: ACTION_SHEET_WIDTH,
        height: ACTION_SHEET_HEIGHT,
        borderRadius: ACTION_SHEET_BORDER_RADIUS,
        border: `1px solid ${theme.palette.getAccent100()}`,
        boxSizing: "border-box",
        overflow: "auto",
    };
}

export function actionSheetStyle(messageComposerStyle : MessageComposerStyle | undefined, theme : CometChatTheme) : ActionSheetStyle {
    return new ActionSheetStyle({
        layoutModeIconTint: messageComposerStyle?.ActionSheetLayoutModeIconTint || theme.palette.getAccent(),
        borderRadius: ACTION_SHEET_BORDER_RADIUS,
        border: "none",
        width: "100%",
        height: "100%",
        background: theme.palette.getBackground(),
        titleFont: messageComposerStyle?.ActionSheetTitleFont || fontHelper(theme.typography.title2), 
        titleColor: messageComposerStyle?.ActionSheetTitleColor || theme.palette.getAccent(), 
        ActionSheetSeparatorTint: messageComposerStyle?.ActionSheetSeparatorTint || `1px solid ${theme.palette.getAccent400()}`
    });
}

export function attachmentButtonStyle(messageComposerStyle : MessageComposerStyle | undefined, theme : CometChatTheme, isSecondaryContentDisplayed : boolean) {
    return {
        height: "24px",
        width: "24px",
        border: "none",
        borderRadius: "0",
        buttonIconTint: getAttachButtonIconTint(messageComposerStyle, theme, isSecondaryContentDisplayed),
        background: "transparent"
    };
}

// Default auxiliary view related styles

const EMOJI_KEYBOARD_HEIGHT = "400px";
const EMOJI_KEYBOARD_WIDTH = "320px";
const EMOJI_KEYBOARD_BORDER_RADIUS = "12px";

export function emojiKeyboardPopoverStyle() : PopoverStyle {
    return new PopoverStyle({
        width: EMOJI_KEYBOARD_WIDTH,
        height: EMOJI_KEYBOARD_HEIGHT,
        borderRadius: EMOJI_KEYBOARD_BORDER_RADIUS,
        boxShadow: "0px 0px 0px 1px rgba(20, 20, 20, 0.04), 0px 16px 32px 0px rgba(20, 20, 20, 0.2)"
    });
}

export function emojiKeyboardContainerStyle(theme : CometChatTheme) : CSSProperties {
    return {
        width: EMOJI_KEYBOARD_WIDTH,
        height: EMOJI_KEYBOARD_HEIGHT,
        borderRadius: EMOJI_KEYBOARD_BORDER_RADIUS,
        border: `1px solid ${theme.palette.getAccent100()}`,
        boxSizing: "border-box"
    };
}

export function emojiKeyboardStyle(messageComposerStyle : MessageComposerStyle | undefined, theme : CometChatTheme) : EmojiKeyboardStyle {
    return new EmojiKeyboardStyle({
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: EMOJI_KEYBOARD_BORDER_RADIUS,
        background: theme.palette.getBackground(),
        textFont: messageComposerStyle?.emojiKeyboardTextFont || fontHelper(theme.typography.caption1),
        textColor: messageComposerStyle?.emojiKeyboardTextColor || theme.palette.getAccent()
    });
}

export function emojiButtonStyle(messageComposerStyle : MessageComposerStyle | undefined, theme : CometChatTheme, isAuxiliaryContentDisplayed : boolean, applyHorizontalMargin : boolean = false) {
    const marginStyle : {margin? : string} = {};

    if (applyHorizontalMargin) {
        marginStyle.margin = `0px ${RIGHT_MOST_BUTTON_HORIZONTAL_MARGIN}`;
    }

    return {
        height: "24px",
        width: "24px",
        border: "none",
        borderRadius: "0",
        buttonIconTint: getEmojiButtonIconTint(messageComposerStyle, theme, isAuxiliaryContentDisplayed),
        background: "transparent",
        ...marginStyle
    };
}

export function defaultAuxiliaryViewContainer() : CSSProperties {
    return {
        display: "flex",
        columnGap: "12px"
    };
}
